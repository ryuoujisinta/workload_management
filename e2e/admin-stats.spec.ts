import { test, expect } from '@playwright/test'

// このスペックは 'admin' プロジェクトで実行される
test.describe('Admin Statistics (プロジェクト別集計)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/projects/stats')
  })

  test('集計ページが表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'プロジェクト別工数集計' })).toBeVisible()
    await expect(page.getByText('フィルター設定')).toBeVisible()
  })

  test('年度切り替えフィルターが機能する', async ({ page }) => {
    const yearDisplay = page.locator('div').filter({ hasText: /\d+年度/ }).filter({ hasNot: page.getByRole('link') }).last()
    const initialYearText = await yearDisplay.textContent()
    
    // 前年度へ
    await page.getByRole('link', { name: /← \d+年度/ }).click()
    await expect(yearDisplay).not.toHaveText(initialYearText!)

    // 次年度へ (元に戻す)
    await page.getByRole('link', { name: /\d+年度 →/ }).click()
    await expect(yearDisplay).toHaveText(initialYearText!)
  })

  test('タブの切り替えが機能する', async ({ page }) => {
    // ユーザー別タブ
    await page.getByRole('link', { name: 'ユーザー別', exact: true }).click()
    await expect(page).toHaveURL(/.*tab=user.*/)
    await expect(page.getByText(/ユーザー別集計/)).toBeVisible()

    // タスク×ユーザー別タブ
    await page.getByRole('link', { name: 'タスク×ユーザー別', exact: true }).click()
    await expect(page).toHaveURL(/.*tab=taskUser.*/)
    await expect(page.getByText(/タスク×ユーザー別集計/)).toBeVisible()

    // タスク別タブに戻る
    await page.getByRole('link', { name: 'タスク別', exact: true }).click()
    await expect(page).toHaveURL(/.*tab=task.*/)
    await expect(page.getByText(/タスク別集計/)).toBeVisible()
  })

  test('プロジェクトフィルターが機能する', async ({ page }) => {
    const projectSelect = page.locator('select#projectId')
    const options = await projectSelect.locator('option').all()
    
    if (options.length > 1) {
      // 最初のプロジェクトを選択（0番目は「全プロジェクト」）
      const firstProjectName = await options[1].textContent()
      await projectSelect.selectOption({ label: firstProjectName! })
      await page.getByRole('button', { name: '選択' }).click()
      
      await expect(page.url()).toContain('projectId=')
      await expect(page.getByRole('heading', { name: 'プロジェクト別工数集計' })).toBeVisible()
    } else {
      test.skip()
    }
  })
})
