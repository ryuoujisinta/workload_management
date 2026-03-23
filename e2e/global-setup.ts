import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

async function globalSetup() {
  const backupPath = path.resolve(__dirname, 'db-backup.sql')
  console.log('--- Creating database backup ---')
  try {
    // pg_dumpを使用してバックアップを作成 (--clean --if-exists でリストア時に既存テーブルを削除するようにする)
    execSync(`wsl docker exec workload-postgres pg_dump -U postgres --clean --if-exists workload_db > "${backupPath}"`, { stdio: ['ignore', 'ignore', 'inherit'] })
    console.log(`Backup created at: ${backupPath}`)
  } catch (error) {
    console.error('Failed to create database backup:', error)
    // バックアップに失敗してもテストは続行する場合が多いが、要件に応じて終了させることも可能
  }
}

export default globalSetup
