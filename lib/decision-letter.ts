import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";

import { prisma } from "@/lib/prisma";
import { getActiveTemplateByType, ensurePdfPreview, convertDocxToPdf } from "@/lib/template-store";
import type { LabDepartmentValue, LabProgramValue } from "@/lib/lab-enums";

type ReservationFlow = "GENERAL" | "LAB_SKRIPSI" | "LAB_LAINNYA";

type OfficialSigner = {
	user_id: string;
	name: string;
	identifier: string | null;
	rank: string | null;
	position: string | null;
	signatureUrl: string | null;
};

const DECISION_LETTER_RELATIVE_DIR = path.join("public", "uploads", "decision-letters");
const DECISION_LETTER_DIR = path.join(process.cwd(), DECISION_LETTER_RELATIVE_DIR);

const escapeXml = (value: string) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildPlaceholderRegex = (placeholder: string) => {
	const gap = "(?:<[^>]+>)*";
	const chars = placeholder
		.split("")
		.map((char) => escapeRegExp(char))
		.join(gap);

	return new RegExp(`\\{${gap}\\{?${gap}\\{?${gap}${chars}${gap}\\}\\}`, "i");
};

const replacePlaceholderOnce = (xml: string, placeholder: string, value: string) => {
	const regex = buildPlaceholderRegex(placeholder);
	return xml.replace(regex, escapeXml(value));
};

const imageContentType = (extension: string) => {
	if (extension === ".png") return "image/png";
	if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
	if (extension === ".webp") return "image/webp";
	return null;
};

const createDrawingRun = (relationshipId: string, drawingId: number) => `
<w:r>
  <w:drawing>
    <wp:inline distT="0" distB="0" distL="0" distR="0">
      <wp:extent cx="2100000" cy="700000"/>
      <wp:effectExtent l="0" t="0" r="0" b="0"/>
      <wp:docPr id="${drawingId}" name="Signature ${drawingId}"/>
      <wp:cNvGraphicFramePr>
        <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
      </wp:cNvGraphicFramePr>
      <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
          <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:nvPicPr>
              <pic:cNvPr id="${drawingId}" name="Signature ${drawingId}"/>
              <pic:cNvPicPr/>
            </pic:nvPicPr>
            <pic:blipFill>
              <a:blip r:embed="${relationshipId}"/>
              <a:stretch><a:fillRect/></a:stretch>
            </pic:blipFill>
            <pic:spPr>
              <a:xfrm>
                <a:off x="0" y="0"/>
                <a:ext cx="2100000" cy="700000"/>
              </a:xfrm>
              <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
            </pic:spPr>
          </pic:pic>
        </a:graphicData>
      </a:graphic>
    </wp:inline>
  </w:drawing>
</w:r>`;

const replaceImagePlaceholderOnce = (xml: string, relationshipId: string, drawingId: number) => {
	const regex = buildPlaceholderRegex("tanda_tangan");
	const match = regex.exec(xml);
	if (!match || match.index === undefined) {
		throw new Error("Placeholder {{tanda_tangan}} tidak ditemukan pada template.");
	}

	const priorXml = xml.slice(0, match.index);
	const runMatches = [...priorXml.matchAll(/<w:r(?:\s|>)/g)];
	const runStart = runMatches.at(-1)?.index ?? -1;
	const runEnd = xml.indexOf("</w:r>", match.index + match[0].length);
	if (runStart === -1 || runEnd === -1) {
		throw new Error("Placeholder {{tanda_tangan}} tidak berada pada run dokumen yang valid.");
	}

	return `${xml.slice(0, runStart)}${createDrawingRun(relationshipId, drawingId)}${xml.slice(runEnd + "</w:r>".length)}`;
};

const appendImageRelationship = (relsXml: string, relationshipId: string, target: string) =>
	relsXml.replace(
		"</Relationships>",
		`<Relationship Id="${relationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${target}"/></Relationships>`,
	);

const ensureImageContentType = (contentTypesXml: string, extension: string, mimeType: string) => {
	const normalizedExt = extension.replace(/^\./, "");
	const alreadyExists = new RegExp(`<Default[^>]+Extension="${escapeRegExp(normalizedExt)}"`, "i").test(contentTypesXml);
	if (alreadyExists) return contentTypesXml;

	return contentTypesXml.replace(
		"</Types>",
		`<Default Extension="${normalizedExt}" ContentType="${mimeType}"/></Types>`,
	);
};

const formatDate = (value: Date) =>
	new Intl.DateTimeFormat("id-ID", {
		day: "2-digit",
		month: "long",
		year: "numeric",
		timeZone: "Asia/Makassar",
	}).format(value);

const formatTime = (value: Date) =>
	new Intl.DateTimeFormat("id-ID", {
		hour: "2-digit",
		minute: "2-digit",
		timeZone: "Asia/Makassar",
	}).format(value);

const formatDateRange = (start: Date, end: Date) => {
	const startLabel = formatDate(start);
	const endLabel = formatDate(end);
	return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
};

const splitReservationPurpose = (value: string) => {
	const [activityName, ...purposeParts] = value.split(" - ");
	return {
		activityName: activityName.trim() || "-",
		purpose: purposeParts.join(" - ").trim() || "-",
	};
};

const assertSignerComplete = (signer: OfficialSigner, roleLabel: string) => {
	if (!signer.identifier || !signer.rank || !signer.position || !signer.signatureUrl) {
		throw new Error(
			`Profil ${roleLabel} belum lengkap. Pastikan NIP, pangkat/golongan, jabatan, dan tanda tangan sudah diisi.`,
		);
	}
};

const getSignersForReservation = async (params: {
	flow: ReservationFlow;
	labDepartment: LabDepartmentValue | null;
	labProgram: LabProgramValue | null;
}) => {
	if (params.flow === "GENERAL") {
		const [dekan, wd2] = await Promise.all([
			prisma.user.findFirst({
				where: { role: "ADMIN_DEKAN" },
				select: { user_id: true, name: true, identifier: true, rank: true, position: true, signatureUrl: true },
			}),
			prisma.user.findFirst({
				where: { role: "ADMIN_WD2" },
				select: { user_id: true, name: true, identifier: true, rank: true, position: true, signatureUrl: true },
			}),
		]);

		if (!dekan || !wd2) {
			throw new Error("Akun Admin Dekan atau Admin Wakil Dekan 2 belum tersedia.");
		}

		assertSignerComplete(dekan, "Admin Dekan");
		assertSignerComplete(wd2, "Admin Wakil Dekan 2");
		return [dekan, wd2];
	}

	if (params.flow === "LAB_LAINNYA" || params.flow === "LAB_SKRIPSI") {
		const [kajur, kepalaLab] = await Promise.all([
			prisma.user.findFirst({
				where: {
					role: "KAJUR",
					...(params.labDepartment ? { departmentScope: params.labDepartment } : {}),
				},
				select: { user_id: true, name: true, identifier: true, rank: true, position: true, signatureUrl: true },
			}),
			prisma.user.findFirst({
				where: {
					role: "KEPALA_LAB",
					...(params.labProgram ? { programScope: params.labProgram } : {}),
				},
				select: { user_id: true, name: true, identifier: true, rank: true, position: true, signatureUrl: true },
			}),
		]);

		if (!kajur || !kepalaLab) {
			throw new Error("Akun Kajur atau Kepala Lab yang sesuai belum tersedia.");
		}

		assertSignerComplete(kajur, "Kajur");
		assertSignerComplete(kepalaLab, "Kepala Lab");
		return [kajur, kepalaLab];
	}

	throw new Error("Alur peminjaman tidak dikenali.");
};

export const generateDecisionLetterForReservation = async (reservationId: string) => {
	const reservation = await prisma.reservation.findUnique({
		where: { res_id: reservationId },
		select: {
			res_id: true,
			res_flow: true,
			res_startTime: true,
			res_endTime: true,
			res_purpose: true,
			res_labDepartment: true,
			res_labProgram: true,
			user: {
				select: {
					name: true,
					identifier: true,
				},
			},
			room: {
				select: {
					room_name: true,
				},
			},
		},
	});

	if (!reservation) {
		throw new Error("Pengajuan tidak ditemukan.");
	}

	const template = await getActiveTemplateByType(reservation.res_flow);
	if (!template) {
		throw new Error("Template surat keputusan belum tersedia.");
	}

	await ensurePdfPreview(template.id);

	const signers = await getSignersForReservation({
		flow: reservation.res_flow,
		labDepartment: reservation.res_labDepartment,
		labProgram: reservation.res_labProgram,
	});

	const officialSequence =
		reservation.res_flow === "GENERAL"
			? [signers[0], signers[0], signers[1]]
			: [signers[0], signers[0], signers[1]];

	const docxAbsolutePath = path.join(process.cwd(), template.storedPath);
	const docxBuffer = await fs.readFile(docxAbsolutePath);
	const zip = await JSZip.loadAsync(docxBuffer);

	const documentFile = zip.file("word/document.xml");
	const relsFile = zip.file("word/_rels/document.xml.rels");
	const contentTypesFile = zip.file("[Content_Types].xml");

	if (!documentFile || !relsFile || !contentTypesFile) {
		throw new Error("Struktur template DOCX tidak lengkap.");
	}

	let documentXml = await documentFile.async("string");
	let relsXml = await relsFile.async("string");
	let contentTypesXml = await contentTypesFile.async("string");

	const reservationPurpose = splitReservationPurpose(reservation.res_purpose);
	const currentDate = new Date();

	const staticPlaceholders: Record<string, string> = {
		nama_mahasiswa: reservation.user.name,
		nim: reservation.user.identifier ?? "-",
		nama_kegiatan: reservationPurpose.activityName,
		tanggal_kegiatan: formatDateRange(reservation.res_startTime, reservation.res_endTime),
		waktu: `${formatTime(reservation.res_startTime)} - ${formatTime(reservation.res_endTime)}`,
		nama_ruangan: reservation.room.room_name,
		tujuan_peminjaman: reservationPurpose.purpose,
		tanggal: formatDate(currentDate),
		prodi: reservation.res_labProgram ?? "-",
		jurusan: reservation.res_labDepartment ?? "-",
	};

	for (const [placeholder, value] of Object.entries(staticPlaceholders)) {
		documentXml = replacePlaceholderOnce(documentXml, placeholder, value);
	}

	for (const signer of officialSequence) {
		documentXml = replacePlaceholderOnce(documentXml, "official", signer.name);
		documentXml = replacePlaceholderOnce(documentXml, "nip", signer.identifier ?? "-");
		documentXml = replacePlaceholderOnce(documentXml, "pangkat", signer.rank ?? "-");
		documentXml = replacePlaceholderOnce(documentXml, "jabatan", signer.position ?? "-");
	}

	for (const [index, signer] of signers.entries()) {
		const signatureUrl = signer.signatureUrl!;
		const signatureAbsolutePath = path.join(process.cwd(), "public", signatureUrl.replace(/^\/+/, ""));
		const extension = path.extname(signatureAbsolutePath).toLowerCase();
		const mimeType = imageContentType(extension);
		if (!mimeType) {
			throw new Error("Format tanda tangan tidak didukung.");
		}

		const signatureBuffer = await fs.readFile(signatureAbsolutePath);
		const mediaFileName = `signature-${reservation.res_id}-${index + 1}${extension}`;
		zip.file(`word/media/${mediaFileName}`, signatureBuffer);

		const relationshipId = `rIdSignature${index + 1}`;
		relsXml = appendImageRelationship(relsXml, relationshipId, `media/${mediaFileName}`);
		contentTypesXml = ensureImageContentType(contentTypesXml, extension, mimeType);
		documentXml = replaceImagePlaceholderOnce(documentXml, relationshipId, 900 + index);
	}

	zip.file("word/document.xml", documentXml);
	zip.file("word/_rels/document.xml.rels", relsXml);
	zip.file("[Content_Types].xml", contentTypesXml);

	await fs.mkdir(DECISION_LETTER_DIR, { recursive: true });

	const outputDocxFilename = `${reservation.res_id}.docx`;
	const outputPdfFilename = `${reservation.res_id}.pdf`;
	const outputDocxPath = path.join(DECISION_LETTER_DIR, outputDocxFilename);
	const outputPdfPath = path.join(DECISION_LETTER_DIR, outputPdfFilename);

	const renderedDocx = await zip.generateAsync({ type: "nodebuffer" });
	await fs.writeFile(outputDocxPath, renderedDocx);

	await convertDocxToPdf({
		inputAbsolutePath: outputDocxPath,
		outputDirAbsolutePath: DECISION_LETTER_DIR,
		expectedPdfAbsolutePath: outputPdfPath,
	});

	const decisionDocumentUrl = `/uploads/decision-letters/${outputPdfFilename}`;

	await prisma.reservation.update({
		where: { res_id: reservation.res_id },
		data: { res_decisionDocumentUrl: decisionDocumentUrl },
	});

	return {
		decisionDocumentUrl,
	};
};
