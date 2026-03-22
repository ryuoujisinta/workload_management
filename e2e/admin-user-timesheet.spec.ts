import { test, expect } from '@playwright/test'

// このスペックは 'admin' プロジェクトで実行される
test.describe('Admin User Timesheet View (個人別工数確認)', () => {
  test.beforeEach(async ({ page }) => {
    // まずユーザー管理ページへ
    await page.goto('/admin/users')
  })

  test('特定のユーザーの工数一覧画面へ遷移し、表示を確認できる', async ({ page }) => {
    // 一般ユーザーの行を探して「工数確認」ボタンをクリック
    const userRow = page.getByRole('row').filter({ hasText: 'user@example.com' })
    await userRow.getByRole('button', { name: '工数確認' }).click()
    
    // URLに ID が含まれ、見出しにユーザー名が含まれることを確認
    await expect(page).toHaveURL(/\/admin\/users\/.*\/timesheet/)
    await expect(page.getByRole('heading', { name: /の工数一覧/ })).toBeVisible()
    await expect(page.getByText('月次タイムシート')).toBeVisible()
  })

  test('月ナビゲーションが機能する', async ({ page }) => {
    // 最初のユーザーの工数画面へ
    await page.getByRole('button', { name: '工数確認' }).first().click()
    
    const initialText = await page.locator('.font-medium.text-sm.w-20.text-center').textContent()
    
    // 次月へ (ChevronRight)
    await page.locator('button:has(svg.lucide-chevron-right)').click()
    await expect(page).toHaveURL(/.*month=.*/)
    
    // 値の変化を確認
    await expect(page.locator('.font-medium.text-sm.w-20.text-center')).not.toHaveText(initialText!)

    // 前月へ (ChevronLeft)
    await page.locator('button:has(svg.lucide-chevron-left)').click()
    await expect(page.locator('.font-medium.text-sm.w-20.text-center')).toHaveText(initialText!)
  })

  test('戻るボタンが機能する', async ({ page }) => {
    await page.getByRole('button', { name: '工数確認' }).first().click()
    
    // Back button (ArrowLeft)
    await page.locator('button:has(svg.lucide-arrow-left)').click()
    await expect(page).toHaveURL('/admin/users')
  })
})
