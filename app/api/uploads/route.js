import { fail, ok } from "@/lib/api-response";
import { cloudinary, getCloudinaryFolder } from "@/lib/cloudinary";

export const runtime = "nodejs";

function uploadBufferToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });

    stream.end(buffer);
  });
}

export async function POST(request) {
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return fail("Cloudinary env values are missing.", 503);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return fail("No file provided.", 422);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadBufferToCloudinary(buffer, {
      folder: getCloudinaryFolder(),
      resource_type: "auto",
      public_id: `${Date.now()}-${file.name.replace(/\.[^.]+$/, "")}`.replace(/[^a-zA-Z0-9-_]/g, "-"),
    });

    return ok({
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
    });
  } catch {
    return fail("Upload failed.", 500);
  }
}
