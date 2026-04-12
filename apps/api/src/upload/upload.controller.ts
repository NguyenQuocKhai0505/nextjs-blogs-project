import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common"
import { FilesInterceptor } from "@nestjs/platform-express"
import { v2 as cloudinary } from "cloudinary"

import { UploadFromUrlDto } from "./dto/upload-from-url.dto.js"
import { isPassthroughEmbedVideoUrl } from "./embed-video-url.js"

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"]

type MediaType = "image" | "video"

function getResourceType(mime: string): MediaType {
  if (IMAGE_TYPES.includes(mime)) return "image"
  if (VIDEO_TYPES.includes(mime)) return "video"
  return "image"
}

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  m4v: "video/mp4",
}

/** Browsers sometimes send octet-stream or empty MIME; infer from filename. */
function effectiveMime(originalname: string, mimetype: string): string {
  const allowed = new Set([...IMAGE_TYPES, ...VIDEO_TYPES])
  if (allowed.has(mimetype)) return mimetype
  const dot = originalname.lastIndexOf(".")
  const ext = dot >= 0 ? originalname.slice(dot + 1).toLowerCase() : ""
  const fromExt = EXT_TO_MIME[ext]
  if (fromExt && allowed.has(fromExt)) return fromExt
  return mimetype
}

@Controller("upload")
export class UploadController {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })
  }

  @Post()
  @UseInterceptors(
    FilesInterceptor("files", 10, {
      limits: { fileSize: 50 * 1024 * 1024 }, // per-file upper bound (we validate by type too)
    })
  )
  async upload(
    @UploadedFiles()
    files: Array<{
      mimetype: string
      originalname: string
      size: number
      buffer: Buffer
    }>
  ) {
    if (!files?.length) {
      throw new BadRequestException("No file uploaded")
    }

    const allowedTypes = new Set([...IMAGE_TYPES, ...VIDEO_TYPES])

    const uploads = await Promise.all(
      files.map(async file => {
        const mime = effectiveMime(file.originalname, file.mimetype)
        if (!allowedTypes.has(mime)) {
          throw new BadRequestException(`Invalid file type: ${file.originalname}`)
        }

        const resourceType = getResourceType(mime)
        const maxSize = resourceType === "video" ? 50 * 1024 * 1024 : 10 * 1024 * 1024
        if (file.size > maxSize) {
          throw new BadRequestException(
            `File ${file.originalname} exceeds ${resourceType === "video" ? "50MB" : "10MB"} limit`
          )
        }

        return new Promise<{ url: string; type: MediaType }>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                resource_type: resourceType,
                folder: "blog-posts",
                ...(resourceType === "image" && {
                  transformation: [
                    { width: 1920, height: 1080, crop: "limit" },
                    { quality: "auto" },
                  ],
                }),
              },
              (error, result) => {
                if (error) return reject(error)
                if (!result?.secure_url) return reject(new Error("Upload failed"))
                resolve({ url: result.secure_url, type: resourceType })
              }
            )
            .end(file.buffer)
        })
      })
    )

    const imageUrls = uploads.filter(u => u.type === "image").map(u => u.url)
    const videoUrls = uploads.filter(u => u.type === "video").map(u => u.url)

    return {
      success: true,
      imageUrls,
      videoUrls,
    }
  }

  /** Fetch remote file and upload to Cloudinary (used by post form “paste URL”). */
  @Post("from-url")
  async uploadFromUrl(@Body() dto: UploadFromUrlDto) {
    const resourceType: MediaType = dto.mediaType === "video" ? "video" : "image"

    if (resourceType === "video" && isPassthroughEmbedVideoUrl(dto.mediaUrl)) {
      return {
        success: true,
        imageUrls: [] as string[],
        videoUrls: [dto.mediaUrl.trim()],
      }
    }

    try {
      const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        cloudinary.uploader.upload(
          dto.mediaUrl,
          {
            resource_type: resourceType,
            folder: "blog-posts",
            ...(resourceType === "image" && {
              transformation: [
                { width: 1920, height: 1080, crop: "limit" },
                { quality: "auto" },
              ],
            }),
          },
          (error, res) => {
            if (error) return reject(error)
            if (!res?.secure_url) return reject(new Error("Upload failed"))
            resolve({ secure_url: res.secure_url })
          }
        )
      })

      const url = result.secure_url
      return {
        success: true,
        imageUrls: resourceType === "image" ? [url] : [],
        videoUrls: resourceType === "video" ? [url] : [],
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string"
          ? (err as { message: string }).message
          : "Could not upload from this URL"
      throw new BadRequestException(msg)
    }
  }
}

