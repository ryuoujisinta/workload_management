import { test, expect } from '@playwright/test'

// このスペックは 'admin' プロジェクト (storageState=admin) で実行される
test.describe('Admin Dashboard (管理者)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('ダッシュボードに管理者メニューが表示される', async ({ page }) => {
    await expect(page.getByText('工数タイムシート')).toBeVisible()
    await expect(page.getByText('管理者メニュー')).toBeVisible()
    await expect(page.getByRole('link', { name: '管理者ダッシュボードへ' })).toBeVisible()
  })

  test('管理者ダッシュボードへのリンクが機能する', async ({ page }) => {
    await page.getByRole('link', { name: '管理者ダッシュボードへ' }).click()
    await expect(page).toHaveURL('/admin')
    await expect(page.getByRole('heading', { name: '管理者ダッシュボード' })).toBeVisible()
  })
})
