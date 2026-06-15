#!/usr/bin/env node
/**
 * Production migrate helper: clears removed failed migration (P3009) then deploys.
 * Render Start/Build: npm run migrate:deploy
 */
import { execSync } from "node:child_process"

/** Removed migration — may still be marked failed on production DB */
const ORPHAN_MIGRATION = "20260606130000_story_reactions"

function run(cmd, { allowFail = false, input } = {}) {
  try {
    execSync(cmd, {
      stdio: input ? ["pipe", "inherit", "inherit"] : "inherit",
      env: process.env,
      input,
    })
  } catch {
    if (!allowFail) process.exit(1)
  }
}

console.log("[migrate-deploy] clearing orphan failed migration if present...")
// resolve only works when the migration folder still exists locally
run(`npx prisma migrate resolve --rolled-back ${ORPHAN_MIGRATION}`, {
  allowFail: true,
})
run(`npx prisma migrate resolve --applied ${ORPHAN_MIGRATION}`, {
  allowFail: true,
})

console.log(
  "[migrate-deploy] deleting orphan migration row from _prisma_migrations..."
)
run("npx prisma db execute --stdin", {
  allowFail: true,
  input: `DELETE FROM "_prisma_migrations" WHERE migration_name = '${ORPHAN_MIGRATION}';\n`,
})

console.log("[migrate-deploy] applying migrations...")
run("npx prisma migrate deploy")

console.log("[migrate-deploy] done")
