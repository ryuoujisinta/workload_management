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
    const taskCard = page.locator('[data-slot="card"]').first()
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

  test('月ナビゲーションが機能する', async ({ page }) => {
    const initialText = await page.locator('h1 + p').textContent()
    
    // 次月へ
    await page.getByRole('link', { name: '次月' }).click()
    await expect(page).toHaveURL(/.*month=.*/)
    const nextText = await page.locator('h1 + p').textContent()
    expect(nextText).not.toBe(initialText)

    // 前月へ
    await page.getByRole('link', { name: '前月' }).click()
    await expect(page.locator('h1 + p')).toHaveText(initialText!)
  })

  test('マイタスクの解除が機能する', async ({ page }) => {
    const taskCard = page.locator('[data-slot="card"]').first()
    const removeButton = page.getByRole('button', { name: 'マイタスクから解除' }).first()
    
    if (await removeButton.isVisible()) {
      await removeButton.click()
      await expect(page.getByRole('button', { name: 'マイタスクに追加' }).first()).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('マイタスクの追加・解除がタイムシート画面に反映される', async ({ page }) => {
    // 1. まず全タスクを解除してクリーンな状態にする
    const removeBtns = page.getByRole('button', { name: 'マイタスクから解除' })
    while (await removeBtns.count() > 0) {
      const countBefore = await removeBtns.count()
      await removeBtns.first().click()
      // ボタンが減るのを待機（最大5秒）
      await expect(removeBtns).toHaveCount(countBefore - 1)
    }

    // 2. タスクを追加 (まだ追加されていないカードを選択)
    const initialCard = page.locator('[data-slot="card"]').filter({ has: page.getByRole('button', { name: 'マイタスクに追加' }) }).first()
    const taskName = await initialCard.locator('[data-slot="card-title"]').textContent()
    await initialCard.getByRole('button', { name: 'マイタスクに追加' }).click()
    
    // 追加後は「マイタスクから解除」ボタンが表示されることを確認
    // 再取得時にフィルタリング条件（ボタンの種類）に依存しないようにする
    const taskCard = page.locator('[data-slot="card"]').filter({ hasText: taskName! }).first()
    await expect(taskCard.getByRole('button', { name: 'マイタスクから解除' })).toBeVisible()

    // 3. タイムシート画面に移動して反映を確認
    await page.goto('/user/timesheet')
    // タイムシートのテーブル内にタスク名が存在することを確認
    await expect(page.locator('table')).toContainText(taskName!, { timeout: 10000 })

    // 4. マイタスクに戻って解除
    await page.goto('/user/tasks')
    await page.getByRole('button', { name: 'マイタスクから解除' }).first().click()
    await expect(page.getByRole('button', { name: 'マイタスクに追加' }).first()).toBeVisible()

    // 5. タイムシート画面で消えていることを確認
    // ネットワークが落ち着くまで待機して ECONNRESET を防ぐ
    await page.goto('/user/timesheet', { waitUntil: 'networkidle' })
    // 1つもタスクがない場合はテーブル自体が表示されないため、ページ全体で確認する
    await expect(page.getByText(taskName!)).not.toBeVisible()
  })
})
