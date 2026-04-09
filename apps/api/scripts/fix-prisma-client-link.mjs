import fs from "node:fs"
import path from "node:path"

/**
 * On some Windows setups, Prisma generates the client into `node_modules/.prisma/client`
 * but `@prisma/client`'s `default.d.ts` re-exports from `.prisma/client/default`.
 *
 * This script creates a junction:
 *   node_modules/@prisma/client/.prisma/client  ->  node_modules/.prisma/client
 *
 * so TypeScript/VSCode resolve the correct, freshly generated types (UserRole, relations, ...).
 */
function ensureJunction() {
  const apiRoot = path.resolve(process.cwd())
  const nodeModules = path.join(apiRoot, "node_modules")

  const src = path.join(nodeModules, ".prisma", "client")
  const dst = path.join(nodeModules, "@prisma", "client", ".prisma", "client")

  if (!fs.existsSync(src)) {
    // Nothing to link yet (e.g. dependencies not installed / generate not run).
    return
  }

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

  fs.symlinkSync(src, dst, "junction")
}

ensureJunction()

