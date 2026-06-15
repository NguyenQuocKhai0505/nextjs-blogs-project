#!/usr/bin/env node
/**
 * Production migrate helper: clears removed failed migration (P3009) then deploys.
 * Render Start/Build: npm run migrate:deploy
 */
import { execSync } from "node:child_process"

/** Removed migration — may still be marked failed on production DB */
const ORPHAN_MIGRATION = "20260606130000_story_reactions"

function run(cmd, { allowFail = false } = {}) {
  try {
    execSync(cmd, { stdio: "inherit", env: process.env })
  } catch {
    if (!allowFail) process.exit(1)
  }
}

console.log("[migrate-deploy] clearing orphan failed migration if present...")
run(`npx prisma migrate resolve --rolled-back ${ORPHAN_MIGRATION}`, {
  allowFail: true,
})

console.log("[migrate-deploy] applying migrations...")
run("npx prisma migrate deploy")

console.log("[migrate-deploy] done")
