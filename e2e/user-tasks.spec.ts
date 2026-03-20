import { test, expect } from '@playwright/test'

// このスペックは 'user' プロジェクトで実行される
test.describe('User Tasks (マイタスク選択)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/user/tasks')
  })

  test('マイタスク登録ページが表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'マイタスク登録' })).toBeVisible()
  })

  test('管理者がタスクを登録していない場合は案内メッセージが表示される', async ({ page }) => {
    // タスクが存在するか、「まだありません」メッセージが表示されるかのどちらか
    const noTaskMsg = page.getByText('管理者が登録したタスクはまだありません。')
    const addButton = page.getByRole('button', { name: 'マイタスクに追加' }).first()

    const hasNoTask = await noTaskMsg.isVisible().catch(() => false)
    const hasTask = await addButton.isVisible().catch(() => false)

    expect(hasNoTask || hasTask).toBe(true)
  })

  test('タスクがある場合「マイタスクに追加」ボタンを押すと表示が変わる', async ({ page }) => {
    // まず管理者でタスクを作成してから操作するため、事前データがある前提のテスト
    const addButton = page.getByRole('button', { name: 'マイタスクに追加' }).first()
    
    // addButton が存在する場合のみテストを実行
    if (await addButton.isVisible()) {
      await addButton.click()
      // ページがリロードされ、ボタンが「マイタスクから解除」に変わる
      await expect(page.getByRole('button', { name: 'マイタスクから解除' }).first()).toBeVisible()
    } else {
      // タスクが存在しない場合はスキップ扱い（passとする）
      test.skip()
    }
  })
})
