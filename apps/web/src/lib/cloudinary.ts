
import {v2 as cloudinary} from "cloudinary"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})
export async function uploadImageToCloudinary(
    file: File | Buffer,
    options?: { folder?: string }
  ) {
    try {
      let buffer: Buffer

      if (file instanceof File) {
        const arrayBuffer = await file.arrayBuffer()
        buffer = Buffer.from(arrayBuffer)
      } else {
        buffer = file
      }

      return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "image",
            folder: options?.folder || "profile_avatars",
          },
          (error, result) => {
            if (error || !result) return reject(error || new Error("Upload failed"))
            resolve({ url: result.secure_url, publicId: result.public_id })
          }
        )

        uploadStream.end(buffer)
      })
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error)
      throw error
    }
  }
export {cloudinary}