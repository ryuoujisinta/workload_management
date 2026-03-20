import { test, expect } from '@playwright/test'

// このスペックは 'admin' プロジェクトで実行される
test.describe('Admin Task Management (タスク管理)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/tasks')
  })

  test('タスク管理ページが表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'タスク管理' })).toBeVisible()
    await expect(page.getByText('タスク一覧')).toBeVisible()
    await expect(page.getByText('新規タスク登録')).toBeVisible()
  })

  test('新規タスクを登録すると一覧に追加される', async ({ page }) => {
    const projectName = `E2Eプロジェクト_${Date.now()}`
    const taskName = `E2Eタスク_${Date.now()}`

    await page.getByLabel('プロジェクト名').fill(projectName)
    await page.getByLabel('タスク名').fill(taskName)
    await page.getByRole('button', { name: '登録する' }).click()

    // ページがリフレッシュされ、登録したタスクが一覧に表示される
    await expect(page.getByText(projectName)).toBeVisible()
    await expect(page.getByText(taskName)).toBeVisible()
  })
})
