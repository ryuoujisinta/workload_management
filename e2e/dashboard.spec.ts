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

  test('工数タイムシートへの遷移が機能する', async ({ page }) => {
    await page.getByRole('link', { name: 'タイムシートを開く' }).click()
    await expect(page).toHaveURL('/user/timesheet')
    await expect(page.getByRole('heading', { name: '工数タイムシート' })).toBeVisible()
  })

  test('マイタスクへの遷移が機能する', async ({ page }) => {
    await page.getByRole('link', { name: 'マイタスクを管理' }).click()
    await expect(page).toHaveURL('/user/tasks')
    await expect(page.getByRole('heading', { name: 'マイタスク登録' })).toBeVisible()
  })

  test('設定への遷移が機能する', async ({ page }) => {
    await page.getByRole('link', { name: '設定を開く' }).click()
    await expect(page).toHaveURL('/user/settings')
    await expect(page.getByRole('heading', { name: '設定' })).toBeVisible()
  })
})
