import type { NextConfig } from "next"
import path from "path"

const nextConfig: NextConfig = {
  // Monorepo: keep file tracing rooted at repo root
  outputFileTracingRoot: path.join(__dirname, "..", ".."),
}

export default nextConfig
