import { IsIn, IsUrl, MaxLength } from "class-validator"

export class UploadFromUrlDto {
  @IsUrl({ require_protocol: true, protocols: ["http", "https"] })
  @MaxLength(2048)
  mediaUrl!: string

  @IsIn(["image", "video"])
  mediaType!: "image" | "video"
}
