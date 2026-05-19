"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUp, Loader2, Save } from "lucide-react";

import { useToast } from "@/app/components/ui/toast";

type ProfileFormProps = {
	initialName: string;
	initialEmail: string;
	role: string;
	initialIdentifier?: string | null;
	initialRank?: string | null;
	initialPosition?: string | null;
	initialSignatureUrl?: string | null;
	emailChanged?: boolean;
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();

export default function ProfileForm({
	initialName,
	initialEmail,
	role,
	initialIdentifier,
	initialRank,
	initialPosition,
	initialSignatureUrl,
	emailChanged,
}: ProfileFormProps) {
	const router = useRouter();
	const { pushToast } = useToast();

	const [name, setName] = useState(initialName);
	const [email, setEmail] = useState(initialEmail);
	const [identifier, setIdentifier] = useState(initialIdentifier ?? "");
	const [rank, setRank] = useState(initialRank ?? "");
	const [position, setPosition] = useState(initialPosition ?? "");
	const [baselineName, setBaselineName] = useState(initialName);
	const [baselineEmail, setBaselineEmail] = useState(initialEmail);
	const [baselineIdentifier, setBaselineIdentifier] = useState(initialIdentifier ?? "");
	const [baselineRank, setBaselineRank] = useState(initialRank ?? "");
	const [baselinePosition, setBaselinePosition] = useState(initialPosition ?? "");

	const [saving, setSaving] = useState(false);
	const [verifyingEmail, setVerifyingEmail] = useState(false);
	const [uploadingSignature, setUploadingSignature] = useState(false);
	const [signatureUrl, setSignatureUrl] = useState<string | null>(initialSignatureUrl ?? null);
	const signatureInputRef = useRef<HTMLInputElement | null>(null);

	const canUploadSignature = useMemo(() => {
		const normalized = (role || "").toUpperCase();
		return (
			normalized === "ADMIN_DEKAN" ||
			normalized === "ADMIN_WD2" ||
			normalized === "KAJUR" ||
			normalized === "KEPALA_LAB"
		);
	}, [role]);

	const requiresOfficialProfile = canUploadSignature;

	const isEmailChanged = useMemo(() => {
		return normalizeEmail(email) !== normalizeEmail(baselineEmail);
	}, [email, baselineEmail]);

	useEffect(() => {
		setName(initialName);
		setBaselineName(initialName);
		setEmail(initialEmail);
		setBaselineEmail(initialEmail);
		setIdentifier(initialIdentifier ?? "");
		setBaselineIdentifier(initialIdentifier ?? "");
		setRank(initialRank ?? "");
		setBaselineRank(initialRank ?? "");
		setPosition(initialPosition ?? "");
		setBaselinePosition(initialPosition ?? "");
		setSignatureUrl(initialSignatureUrl ?? null);
	}, [initialEmail, initialIdentifier, initialName, initialPosition, initialRank, initialSignatureUrl]);

	useEffect(() => {
		if (!emailChanged) return;
		pushToast({
			type: "success",
			title: "Email terverifikasi",
			message: "Email akun berhasil diperbarui. Silakan masuk kembali jika diperlukan.",
		});
	}, [emailChanged, pushToast]);

	const handleSave = async (event: React.FormEvent) => {
		event.preventDefault();

		const trimmedName = name.trim();
		const trimmedEmail = email.trim();
		const trimmedIdentifier = identifier.trim();
		const trimmedRank = rank.trim();
		const trimmedPosition = position.trim();
		const emailNeedsVerification = normalizeEmail(trimmedEmail) !== normalizeEmail(baselineEmail);

		if (!trimmedName) {
			pushToast({ type: "error", message: "Nama tidak boleh kosong." });
			return;
		}

		if (emailNeedsVerification) {
			pushToast({
				type: "warning",
				title: "Verifikasi email",
				message: "Silakan verifikasi email terlebih dahulu dengan menekan tombol Verifikasi.",
				durationMs: 6000,
			});
			return;
		}

		if (requiresOfficialProfile && (!trimmedIdentifier || !trimmedRank || !trimmedPosition)) {
			pushToast({
				type: "error",
				message: "NIP, pangkat/golongan, dan jabatan wajib diisi.",
			});
			return;
		}

		setSaving(true);

		try {
			if (
				trimmedName !== baselineName ||
				trimmedIdentifier !== baselineIdentifier ||
				trimmedRank !== baselineRank ||
				trimmedPosition !== baselinePosition
			) {
				const response = await fetch("/api/admin/profile", {
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						name: trimmedName,
						identifier: trimmedIdentifier,
						rank: trimmedRank,
						position: trimmedPosition,
					}),
				});

				if (!response.ok) {
					const payload = (await response.json().catch(() => null)) as { error?: string } | null;
					throw new Error(payload?.error || "Gagal memperbarui nama.");
				}

				setBaselineName(trimmedName);
				setBaselineIdentifier(trimmedIdentifier);
				setBaselineRank(trimmedRank);
				setBaselinePosition(trimmedPosition);
				pushToast({ type: "success", message: "Profil berhasil diperbarui." });
			}

			router.refresh();
		} catch (error) {
			const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
			pushToast({ type: "error", message });
		} finally {
			setSaving(false);
		}
	};

	const handleSendEmailVerification = async () => {
		const trimmedEmail = email.trim();
		if (!trimmedEmail) {
			pushToast({ type: "error", message: "Email wajib diisi." });
			return;
		}

		setVerifyingEmail(true);
		try {
			const response = await fetch("/api/admin/profile/request-email-change", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email: trimmedEmail }),
			});

			if (!response.ok) {
				const payload = (await response.json().catch(() => null)) as { error?: string } | null;
				throw new Error(payload?.error || "Gagal mengirim email verifikasi.");
			}

			pushToast({
				type: "info",
				title: "Verifikasi email",
				message: "Link verifikasi sudah dikirim ke email baru. Buka email tersebut untuk menyelesaikan perubahan email.",
				durationMs: 6500,
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
			pushToast({ type: "error", message });
		} finally {
			setVerifyingEmail(false);
		}
	};

	const handleSignatureUpload = async (file: File) => {
		setUploadingSignature(true);

		try {
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch("/api/admin/profile/signature", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const payload = (await response.json().catch(() => null)) as { error?: string } | null;
				throw new Error(payload?.error || "Gagal mengupload TTD.");
			}

			const payload = (await response.json()) as { signatureUrl?: string | null };
			setSignatureUrl(payload.signatureUrl ?? null);
			pushToast({ type: "success", message: "TTD berhasil diupload." });
			router.refresh();
		} catch (error) {
			const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
			pushToast({ type: "error", message });
		} finally {
			setUploadingSignature(false);
			if (signatureInputRef.current) {
				signatureInputRef.current.value = "";
			}
		}
	};

	return (
		<form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<div className="space-y-1">
				<h2 className="text-lg font-bold text-slate-900">Ubah Profil</h2>
				<p className="text-sm text-slate-500">Perubahan email membutuhkan verifikasi ulang melalui link di email baru.</p>
			</div>

			<div className="mt-6 space-y-4">
				<div>
					<label className="text-xs font-bold tracking-wider text-slate-700">NAMA</label>
					<input
						type="text"
						required
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
						placeholder="Masukkan nama"
					/>
				</div>

				<div>
					<label className="text-xs font-bold tracking-wider text-slate-700">EMAIL</label>
					<div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
						<input
							type="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
							placeholder="Masukkan email"
						/>
						<button
							type="button"
							onClick={handleSendEmailVerification}
							disabled={!isEmailChanged || verifyingEmail}
							className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{verifyingEmail ? <Loader2 size={16} className="animate-spin" /> : null}
							{verifyingEmail ? "Mengirim..." : "Verifikasi"}
						</button>
					</div>
				</div>

				{requiresOfficialProfile ? (
					<>
						<div>
							<label className="text-xs font-bold tracking-wider text-slate-700">NIP</label>
							<input
								type="text"
								required
								value={identifier}
								onChange={(e) => setIdentifier(e.target.value)}
								className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
								placeholder="Masukkan NIP"
							/>
						</div>

						<div>
							<label className="text-xs font-bold tracking-wider text-slate-700">PANGKAT / GOLONGAN</label>
							<input
								type="text"
								required
								value={rank}
								onChange={(e) => setRank(e.target.value)}
								className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
								placeholder="Contoh: Pembina / IV.a"
							/>
						</div>

						<div>
							<label className="text-xs font-bold tracking-wider text-slate-700">JABATAN</label>
							<input
								type="text"
								required
								value={position}
								onChange={(e) => setPosition(e.target.value)}
								className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
								placeholder="Masukkan jabatan"
							/>
						</div>
					</>
				) : null}

				{canUploadSignature ? (
					<div>
						<label className="text-xs font-bold tracking-wider text-slate-700">UPLOAD TTD (PNG/JPG)</label>
						<div className="mt-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
							<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
								<input
									ref={signatureInputRef}
									type="file"
									accept="image/png,image/jpeg,image/webp"
									disabled={uploadingSignature}
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (!file) return;
										handleSignatureUpload(file);
									}}
									className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800 disabled:opacity-60"
								/>

								<div className="flex items-center gap-2 text-sm text-slate-600">
									{uploadingSignature ? <Loader2 size={16} className="animate-spin" /> : <ImageUp size={16} />}
									<span>{uploadingSignature ? "Mengupload..." : "Pilih file untuk upload"}</span>
								</div>
							</div>

							{signatureUrl ? (
								<div className="mt-4">
									<p className="text-xs font-semibold text-slate-700">Preview TTD</p>
									<div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-3">
										<img
											src={signatureUrl}
											alt="Preview tanda tangan"
											className="max-h-40 w-auto"
										/>
									</div>
								</div>
							) : (
								<p className="mt-3 text-sm text-slate-500">Belum ada TTD yang diupload.</p>
							)}
						</div>
					</div>
				) : null}
			</div>

			<div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<button
					type="submit"
					disabled={saving}
					className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
				>
					{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
					{saving ? "Menyimpan..." : "Simpan Perubahan"}
				</button>
			</div>
		</form>
	);
}
