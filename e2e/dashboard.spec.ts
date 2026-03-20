import { test, expect } from '@playwright/test'

// このスペックは 'user' プロジェクト (storageState=user) で実行される
test.describe('Dashboard (一般ユーザー)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('ダッシュボードが表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible()
  })

  test('一般ユーザーには3つのメニューカードが表示される', async ({ page }) => {
    await expect(page.getByText('工数タイムシート')).toBeVisible()
    await expect(page.getByText('マイタスク', { exact: true })).toBeVisible()
    await expect(page.getByText('設定（マイページ）')).toBeVisible()
  })

  test('一般ユーザーには管理者メニューが表示されない', async ({ page }) => {
    await expect(page.getByText('管理者メニュー')).not.toBeVisible()
  })
})
