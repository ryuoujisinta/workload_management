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

    // 1. プロジェクト登録
    const projectForm = page.locator('form').filter({ hasText: 'プロジェクト名' })
    await projectForm.getByLabel('プロジェクト名').fill(projectName)
    await projectForm.getByRole('button', { name: '登録する' }).click()

    // 2. タスク登録 (プロジェクトを選択してタスク名を入力)
    const taskForm = page.locator('form').filter({ has: page.getByLabel('タスク名') })
    await taskForm.getByLabel('プロジェクト', { exact: true }).selectOption({ label: projectName })
    await taskForm.getByLabel('タスク名').fill(taskName)
    await taskForm.getByRole('button', { name: '登録する' }).click()

    // ページがリフレッシュされ、登録したタスクが一覧に表示される
    await expect(page.getByRole('cell', { name: projectName })).toBeVisible()
    await expect(page.getByRole('cell', { name: taskName })).toBeVisible()
  })
})
