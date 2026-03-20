import { test, expect } from '@playwright/test'

// このスペックは 'user' プロジェクトで実行される
test.describe('User Timesheet (工数タイムシート)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/user/timesheet')
  })

  test('タイムシートページが表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '工数タイムシート' })).toBeVisible()
  })

  test('週のナビゲーションボタンが表示される', async ({ page }) => {
    await expect(page.getByRole('link', { name: '前週' })).toBeVisible()
    await expect(page.getByRole('link', { name: '次週' })).toBeVisible()
  })

  test('「次週」ボタンをクリックすると週が切り替わる', async ({ page }) => {
    const currentUrl = page.url()
    await page.getByRole('link', { name: '次週' }).click()
    // URLに week クエリパラメータが追加され、URLが変わることを確認
    await expect(page).not.toHaveURL(currentUrl)
    await expect(page.url()).toContain('week=')
  })

  test('「前週」ボタンをクリックすると週が切り替わる', async ({ page }) => {
    const currentUrl = page.url()
    await page.getByRole('link', { name: '前週' }).click()
    await expect(page).not.toHaveURL(currentUrl)
    await expect(page.url()).toContain('week=')
  })

  test('マイタスクがない場合は案内メッセージが表示される', async ({ page }) => {
    // タスクが未登録の場合のみ表示される
    const noTaskMsg = page.getByText('マイタスクが1つも登録されていません。')
    const timesheetTable = page.locator('table')

    const hasNoTask = await noTaskMsg.isVisible().catch(() => false)
    const hasTable = await timesheetTable.isVisible().catch(() => false)

    expect(hasNoTask || hasTable).toBe(true)
  })
})
