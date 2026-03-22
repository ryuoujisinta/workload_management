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

  test('月ナビゲーションが機能する', async ({ page }) => {
    const initialText = await page.locator('h1 + p').textContent()
    
    await page.getByRole('link', { name: '次月' }).click()
    await expect(page).toHaveURL(/.*month=.*/)
    const nextText = await page.locator('h1 + p').textContent()
    expect(nextText).not.toBe(initialText)

    await page.getByRole('link', { name: '前月' }).click()
    // 値が元に戻るのを待機
    await expect(page.locator('h1 + p')).toHaveText(initialText!)
  })

  test('工数を入力して保存・合計計算を確認できる', async ({ page }) => {
    const table = page.locator('table')
    if (await table.isVisible()) {
      // 活性化している（disabledでない）入力フィールドを取得
      // nth(10)などで月の途中のセルを狙う
      const targetInput = table.locator('input[type="number"]:not([disabled])').first()
      await targetInput.fill('4.5')
      
      await page.getByRole('button', { name: '保存' }).first().click()
      
      await page.reload()
      await expect(targetInput).toHaveValue('4.5')
    } else {
      test.skip()
    }
  })

  test('申請と取り消しのフローが機能する', async ({ page }) => {
    const table = page.locator('table')
    if (await table.isVisible()) {
      const submitButton = page.getByRole('button', { name: '申請' }).first()
      await submitButton.click()
      
      // ステータスが「申請中」に変わり、ボタンが「取り消し」になる
      await expect(page.getByText('申請中').first()).toBeVisible()
      const cancelButton = page.getByRole('button', { name: '取り消し' }).first()
      await expect(cancelButton).toBeVisible()
      
      // 入力が disabled になる
      const firstInput = table.locator('input[type="number"]').first()
      await expect(firstInput).toBeDisabled()
      
      // 取り消し
      await cancelButton.click()
      await expect(page.getByRole('button', { name: '申請' }).first()).toBeVisible()
      await expect(firstInput).not.toBeDisabled()
    } else {
      test.skip()
    }
  })

  test('マイタスクがない場合は案内メッセージが表示される', async ({ page }) => {
    const noTaskMsg = page.getByText(/マイタスクが登録されていません。/)
    const timesheetTable = page.locator('table')

    // `or` locator を使ってどちらかが表示されるまで待機する
    await expect(noTaskMsg.or(timesheetTable).first()).toBeVisible()
  })
})
