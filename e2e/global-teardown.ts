import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

async function globalTeardown() {
  const backupPath = path.resolve(__dirname, 'db-backup.sql')
  
  if (!fs.existsSync(backupPath)) {
    console.warn('Backup file not found. Skipping restore.')
    return
  }

  console.log('--- Restoring database from backup ---')
  try {
    // psqlを使用してリストアを実行
    // WindowsのPowerShell経由では < リダイレクトが不安定な場合があるため、直接ファイルを渡すかcatを使用
    const backupContent = fs.readFileSync(backupPath)
    execSync(`wsl docker exec -i workload-postgres psql -U postgres workload_db`, {
      input: backupContent,
      stdio: ['pipe', 'inherit', 'inherit']
    })
    console.log('Database restored successfully.')
    
    // バックアップファイルの削除（任意）
    // fs.unlinkSync(backupPath)
  } catch (error) {
    console.error('Failed to restore database:', error)
  }
}

export default globalTeardown
