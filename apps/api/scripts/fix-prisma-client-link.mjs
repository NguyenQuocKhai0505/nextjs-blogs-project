import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

/**
 * Prisma generates into `apps/api/node_modules/.prisma/client`.
 * `@prisma/client` re-exports from `.prisma/client/default` beside the package.
 *
 * In npm workspaces, the IDE often resolves the hoisted root `@prisma/client`
 * which would otherwise see stale types. This script junctions:
 *   .../node_modules/@prisma/client/.prisma/client  ->  apps/api/node_modules/.prisma/client
 */
function linkPrismaClientPackage(prismaClientPkgDir, generatedClientDir) {
  const dst = path.join(prismaClientPkgDir, ".prisma", "client")

  if (!fs.existsSync(prismaClientPkgDir)) return

  fs.mkdirSync(path.dirname(dst), { recursive: true })

  try {
    const st = fs.lstatSync(dst)
    if (st.isSymbolicLink() || st.isDirectory()) {
      fs.rmSync(dst, { recursive: true, force: true })
    } else {
      fs.rmSync(dst, { force: true })
    }
  } catch {
    // ignore
  }

  fs.symlinkSync(generatedClientDir, dst, "junction")
}

function findWorkspaceRoot(apiRoot) {
  let dir = apiRoot
  for (let i = 0; i < 6; i++) {
    const parent = path.dirname(dir)
    if (parent === dir) break
    const pkgPath = path.join(parent, "package.json")
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"))
        if (Array.isArray(pkg.workspaces) && pkg.workspaces.length > 0) {
          return parent
        }
      } catch {
        // ignore
      }
    }
    dir = parent
  }
  return null
}

function ensureJunction() {
  const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const generatedClientDir = path.join(apiRoot, "node_modules", ".prisma", "client")

  if (!fs.existsSync(generatedClientDir)) {
    return
  }

  // apps/api local @prisma/client
  linkPrismaClientPackage(
    path.join(apiRoot, "node_modules", "@prisma", "client"),
    generatedClientDir
  )

  // monorepo root hoisted @prisma/client (fixes IDE / tsserver resolving from root)
  const workspaceRoot = findWorkspaceRoot(apiRoot)
  if (workspaceRoot) {
    linkPrismaClientPackage(
      path.join(workspaceRoot, "node_modules", "@prisma", "client"),
      generatedClientDir
    )
  }
}

ensureJunction()
