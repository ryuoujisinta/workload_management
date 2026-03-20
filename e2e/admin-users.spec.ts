import { test, expect } from '@playwright/test'

// このスペックは 'admin' プロジェクトで実行される
test.describe('Admin User Management (ユーザー管理)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/users')
  })

  test('ユーザー管理ページが表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'ユーザー管理' })).toBeVisible()
    await expect(page.getByText('ユーザー一覧')).toBeVisible()
    await expect(page.getByText('新規ユーザー登録')).toBeVisible()
  })

  test('シードデータのユーザーが一覧に表示される', async ({ page }) => {
    await expect(page.getByText('admin@example.com')).toBeVisible()
    await expect(page.getByText('user@example.com')).toBeVisible()
  })

  test('新規ユーザーを登録すると一覧に追加される', async ({ page }) => {
    const uniqueEmail = `e2e-test-${Date.now()}@example.com`

    await page.getByLabel('氏名').fill('E2Eテストユーザー')
    await page.getByLabel('メールアドレス').fill(uniqueEmail)
    await page.getByLabel('権限').selectOption('USER')
    await page.getByRole('button', { name: '登録する' }).click()

    // ページがリフレッシュされ、新しいユーザーが一覧に表示される
    await expect(page.getByText(uniqueEmail)).toBeVisible()
  })
})
