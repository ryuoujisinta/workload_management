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

    // 3. 当月の有効設定を切り替える
    // 初回は「＋ 当月に追加」ボタンが表示されているはず
    const addButton = page.getByRole('button', { name: '＋ 当月に追加' }).last()
    await expect(addButton).toBeVisible()
    await addButton.click()

    // クリック後は「✓ 当月有効」に変わるはず
    await expect(page.getByRole('button', { name: '✓ 当月有効' }).last()).toBeVisible()
  })

  test('プロジェクトを削除できる', async ({ page }) => {
    const projectName = `DeleteTest_${Date.now()}`
    
    // 1. プロジェクト登録
    const projectForm = page.locator('form').filter({ hasText: 'プロジェクト名' })
    await projectForm.getByLabel('プロジェクト名').fill(projectName)
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/admin/tasks') && res.status() === 200),
      projectForm.getByRole('button', { name: '登録する' }).click()
    ])

    // 2. 登録されたことを確認
    await page.reload()
    await expect(page.getByText(projectName).first()).toBeVisible()

    // 3. 削除ボタンをクリック
    // confirmダイアログを自動的に承諾するように設定
    page.on('dialog', dialog => dialog.accept())
    
    // プロジェクト行を特定して削除ボタンをクリック
    const projectRow = page.locator('div').filter({ hasText: projectName }).filter({ has: page.getByRole('button', { name: '削除' }) }).last()
    await projectRow.getByRole('button', { name: '削除' }).click()

    // 4. 一覧から消えたことを確認
    await page.reload()
    await expect(page.getByText(projectName)).not.toBeVisible()
  })
})
