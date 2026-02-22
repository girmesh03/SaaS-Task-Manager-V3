/**
 * @file Cloudinary upload helper (Phase 4).
 */

const getEnvString = (key) => {
  const value = import.meta.env?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
};

export const isCloudinaryConfigured = () => {
  return Boolean(
    getEnvString("VITE_CLOUDINARY_CLOUD_NAME") &&
      getEnvString("VITE_CLOUDINARY_UPLOAD_PRESET"),
  );
};

const guessResourceType = (file) => {
  const mime = String(file?.type || "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "raw";
};

/**
 * Uploads a file to Cloudinary using unsigned preset.
 *
 * @param {{ file: File }} options - Upload options.
 * @returns {Promise<{ secureUrl: string; publicId: string; resourceType: string }>} Upload result.
 * @throws {Error} Throws when Cloudinary config is missing or upload fails.
 */
export const uploadFileToCloudinary = async ({ file }) => {
  if (!file) {
    throw new Error("File is required");
  }

  const cloudName = getEnvString("VITE_CLOUDINARY_CLOUD_NAME");
  const uploadPreset = getEnvString("VITE_CLOUDINARY_UPLOAD_PRESET");
  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary upload is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.",
    );
  }

  const resourceType = guessResourceType(file);
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || "Cloudinary upload failed";
    throw new Error(message);
  }

  return {
    secureUrl: String(payload?.secure_url || ""),
    publicId: String(payload?.public_id || ""),
    resourceType: String(payload?.resource_type || resourceType),
  };
};

