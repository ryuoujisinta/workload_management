import { defineConfig, devices } from '@playwright/test'
import path from 'path'

const PORT = process.env.PORT || 3000
const baseURL = `http://localhost:${PORT}`

const adminAuthFile = path.join(__dirname, 'e2e/.auth/admin.json')
const userAuthFile = path.join(__dirname, 'e2e/.auth/user.json')

export default defineConfig({
  testDir: './e2e',
  globalSetup: require.resolve('./e2e/global-setup'),
  globalTeardown: require.resolve('./e2e/global-teardown'),
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    // 1. セットアッププロジェクト（認証状態の保存）
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // 2. 管理者ロールのテスト
    {
      name: 'admin',
      testMatch: /e2e\/admin.*\.spec\.ts/,
      dependencies: ['setup'],
      use: { storageState: adminAuthFile },
    },
    // 3. 一般ユーザーロールのテスト
    {
      name: 'user',
      testMatch: /e2e\/(dashboard|user-tasks|timesheet)\.spec\.ts/,
      dependencies: ['setup'],
      use: { storageState: userAuthFile },
    },
    // 4. 認証不要のテスト (login, access-control は自前でログイン状態を制御)
    {
      name: 'no-auth',
      testMatch: /e2e\/(login|access-control)\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
})
