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
const AUDIO_TYPES = [
  "audio/webm",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-m4a",
  "audio/mp3",
]

type MediaType = "image" | "video" | "audio"

function getMediaType(mime: string): MediaType {
  if (IMAGE_TYPES.includes(mime)) return "image"
  if (VIDEO_TYPES.includes(mime)) return "video"
  if (AUDIO_TYPES.includes(mime)) return "audio"
  return "image"
}

/** Cloudinary resource_type for upload_stream. */
function getCloudinaryResourceType(mediaType: MediaType): "image" | "video" {
  return mediaType === "image" ? "image" : "video"
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
  ogg: "audio/ogg",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wav: "audio/wav",
}

/** Browsers sometimes send octet-stream or empty MIME; infer from filename. */
function effectiveMime(originalname: string, mimetype: string): string {
  const allowed = new Set([...IMAGE_TYPES, ...VIDEO_TYPES, ...AUDIO_TYPES])
  if (allowed.has(mimetype)) return mimetype
  const dot = originalname.lastIndexOf(".")
  const ext = dot >= 0 ? originalname.slice(dot + 1).toLowerCase() : ""
  const fromExt = EXT_TO_MIME[ext]
  if (fromExt && allowed.has(fromExt)) return fromExt
  if (ext === "webm" && originalname.toLowerCase().includes("voice")) {
    return "audio/webm"
  }
  return mimetype
}

function maxBytesForType(mediaType: MediaType): number {
  if (mediaType === "video") return 50 * 1024 * 1024
  if (mediaType === "audio") return 5 * 1024 * 1024
  return 10 * 1024 * 1024
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
      limits: { fileSize: 50 * 1024 * 1024 },
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

    const allowedTypes = new Set([...IMAGE_TYPES, ...VIDEO_TYPES, ...AUDIO_TYPES])

    const uploads = await Promise.all(
      files.map(async file => {
        const mime = effectiveMime(file.originalname, file.mimetype)
        if (!allowedTypes.has(mime)) {
          throw new BadRequestException(`Invalid file type: ${file.originalname}`)
        }

        const mediaType = getMediaType(mime)
        const maxSize = maxBytesForType(mediaType)
        if (file.size > maxSize) {
          const label =
            mediaType === "video" ? "50MB" : mediaType === "audio" ? "5MB" : "10MB"
          throw new BadRequestException(
            `File ${file.originalname} exceeds ${label} limit`
          )
        }

        const resourceType = getCloudinaryResourceType(mediaType)

        return new Promise<{ url: string; type: MediaType }>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                resource_type: resourceType,
                folder: mediaType === "audio" ? "chat-voice" : "blog-posts",
                ...(mediaType === "image" && {
                  transformation: [
                    { width: 1920, height: 1080, crop: "limit" },
                    { quality: "auto" },
                  ],
                }),
              },
              (error, result) => {
                if (error) return reject(error)
                if (!result?.secure_url) return reject(new Error("Upload failed"))
                resolve({ url: result.secure_url, type: mediaType })
              }
            )
            .end(file.buffer)
        })
      })
    )

    const imageUrls = uploads.filter(u => u.type === "image").map(u => u.url)
    const videoUrls = uploads.filter(u => u.type === "video").map(u => u.url)
    const audioUrls = uploads.filter(u => u.type === "audio").map(u => u.url)

    return {
      success: true,
      imageUrls,
      videoUrls,
      audioUrls,
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
        audioUrls: [] as string[],
      }
    }

    try {
      const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        cloudinary.uploader.upload(
          dto.mediaUrl,
          {
            resource_type: resourceType === "image" ? "image" : "video",
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
        audioUrls: [] as string[],
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
