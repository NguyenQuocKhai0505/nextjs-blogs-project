#!/usr/bin/env node
/**
 * Production migrate helper:
 * - Fresh DB: just migrate deploy
 * - Existing DB: clear removed failed migration (P3009) then deploy
 * Render Start/Build: npm run migrate:deploy
 */
import { execSync } from "node:child_process"

/** Removed migration — may still be marked failed on older production DBs */
const ORPHAN_MIGRATION = "20260606130000_story_reactions"

function run(cmd, { allowFail = false, input } = {}) {
  try {
    execSync(cmd, {
      stdio: input ? ["pipe", "inherit", "inherit"] : "inherit",
      env: process.env,
      input,
    })
    return true
  } catch {
    if (!allowFail) process.exit(1)
    return false
  }
}

function migrationsTableExists() {
  try {
    execSync("npx prisma db execute --stdin", {
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
      input: `SELECT 1 FROM "_prisma_migrations" LIMIT 1;\n`,
    })
    return true
  } catch {
    return false
  }
}

if (migrationsTableExists()) {
  console.log(
    "[migrate-deploy] _prisma_migrations exists — clearing orphan if present..."
  )
  // resolve only works when the migration folder still exists locally (often fails — OK)
  run(`npx prisma migrate resolve --rolled-back ${ORPHAN_MIGRATION}`, {
    allowFail: true,
  })
  run(`npx prisma migrate resolve --applied ${ORPHAN_MIGRATION}`, {
    allowFail: true,
  })
  run("npx prisma db execute --stdin", {
    allowFail: true,
    input: `DELETE FROM "_prisma_migrations" WHERE migration_name = '${ORPHAN_MIGRATION}';\n`,
  })
} else {
  console.log(
    "[migrate-deploy] fresh database (no _prisma_migrations) — skip orphan cleanup"
  )
}

console.log("[migrate-deploy] applying migrations...")
run("npx prisma migrate deploy")

console.log("[migrate-deploy] done")
