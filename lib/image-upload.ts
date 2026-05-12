import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Saves a base64 encoded image to the local public/uploads/images directory.
 * If the input is not a base64 string, it returns the input as is.
 * 
 * @param dataUrl The base64 data URL (e.g. data:image/png;base64,...) or an existing URL.
 * @param folder The category folder inside public/uploads/images (e.g. "building" or "room").
 * @returns The public URL path to the saved image, or the original string if not base64.
 */
export async function saveBase64Image(dataUrl: string | null, folder: "building" | "room"): Promise<string | null> {
  if (!dataUrl) {
    return null;
  }

  // Check if it is a base64 data URL
  const match = dataUrl.match(/^data:image\/([a-zA-Z+.-]+);base64,(.+)$/);
  
  if (!match) {
    // If it's not a data URL, return it as-is (could be an existing path or external URL)
    return dataUrl;
  }

  const extension = match[1] === "jpeg" ? "jpg" : match[1];
  const base64Data = match[2];

  // Create unique filename
  const fileName = `${crypto.randomUUID()}.${extension}`;
  
  // Resolve absolute path to save
  const publicDir = path.join(process.cwd(), "public");
  const uploadDir = path.join(publicDir, "uploads", "images", folder);

  // Ensure directory exists
  await fs.mkdir(uploadDir, { recursive: true });

  // Define full path and write file
  const filePath = path.join(uploadDir, fileName);
  await fs.writeFile(filePath, Buffer.from(base64Data, "base64"));

  // Return the public URL path
  return `/uploads/images/${folder}/${fileName}`;
}
