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
    // まず「次週」をクリックして前週ボタンを活性化させる
    const nextWeekLink = page.getByRole('link', { name: '次週' })
    if (await nextWeekLink.isVisible()) {
      const nextHref = await nextWeekLink.getAttribute('href')
      if (nextHref && nextHref !== '#') {
        await page.goto('/user/timesheet' + nextHref)
      }
    }
    
    // 表示更新を待つ
    await page.waitForLoadState('networkidle')
    const urlBefore = page.url()

    // 活性化しているはずの「前週」を取得して遷移する
    const prevWeekLink = page.getByRole('link', { name: '前週' })
    const prevHref = await prevWeekLink.getAttribute('href')
    
    // 前週がクリック可能であること（hrefが#でないこと）を確認
    expect(prevHref).not.toBe('#')
    expect(prevHref).toContain('week=')

    if (prevHref && prevHref !== '#') {
       await page.goto('/user/timesheet' + prevHref)
    }
    
    await expect(page).not.toHaveURL(urlBefore)
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
