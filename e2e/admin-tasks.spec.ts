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
    await expect(page.getByText(projectName).first()).toBeVisible()

    // 3. 削除ボタンをクリック
    // confirmダイアログを自動的に承諾するように設定
    page.on('dialog', dialog => dialog.accept())
    
    // プロジェクト行を特定して削除ボタンをクリック
    const projectRow = page.locator('div').filter({ hasText: projectName }).filter({ has: page.getByRole('button', { name: '削除' }) }).last()
    
    await Promise.all([
      // サーバーアクションによる削除処理の完了を待機
      page.waitForResponse(res => res.request().method() === 'POST' && res.status() === 200),
      projectRow.getByRole('button', { name: '削除' }).click()
    ])

    // 4. 一覧から消えたことを確認
    // Next.js の Server Action は自動的に再検証を行うため、reload なしで消えるはず
    // もし安定しない場合は reload しても良いが、POST の完了をしっかり待つ
    await expect(page.getByText(projectName)).toHaveCount(0)
  })

  test('月ナビゲーションが機能する', async ({ page }) => {
    // 現在の月を取得 (デフォルト表示)
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

  test('年度跨ぎの表示切り替えが機能する (12月→1月)', async ({ page }) => {
    // 2025年12月に移動
    await page.goto('/admin/tasks?month=2025-12')
    await expect(page.locator('h1 + p')).toContainText('2025年12月')
    
    // 2025年のプロジェクトを登録
    const projectName2025 = `Project_2025_${Date.now()}`
    const projectForm = page.locator('form').filter({ hasText: 'プロジェクト名' })
    await projectForm.getByLabel('プロジェクト名').fill(projectName2025)
    await projectForm.getByRole('button', { name: '登録する' }).click()
    await expect(page.getByText(projectName2025).first()).toBeVisible()

    // 2026年1月に移動
    await page.getByRole('link', { name: '次月' }).click()
    await expect(page.locator('h1 + p')).toContainText('2026年1月')
    
    // 2025年のプロジェクトが表示されていないことを確認
    await expect(page.getByText(projectName2025)).toHaveCount(0)

    // 2026年のプロジェクトを登録
    const projectName2026 = `Project_2026_${Date.now()}`
    await projectForm.getByLabel('プロジェクト名').fill(projectName2026)
    await projectForm.getByRole('button', { name: '登録する' }).click()
    await expect(page.getByText(projectName2026).first()).toBeVisible()

    // 12月に戻ると2025年のプロジェクトが再表示される
    await page.getByRole('link', { name: '前月' }).click()
    await expect(page.locator('h1 + p')).toContainText('2025年12月')
    await expect(page.getByText(projectName2025).first()).toBeVisible()
    await expect(page.getByText(projectName2026)).toHaveCount(0)
  })

  test('タスクを削除できる', async ({ page }) => {
    const projectName = `TaskDeleteProject_${Date.now()}`
    const taskName = `TaskToDelete_${Date.now()}`

    // プロジェクト登録
    const projectForm = page.locator('form').filter({ hasText: 'プロジェクト名' })
    await projectForm.getByLabel('プロジェクト名').fill(projectName)
    await projectForm.getByRole('button', { name: '登録する' }).click()

    // タスク登録
    const taskForm = page.locator('form').filter({ has: page.getByLabel('タスク名') })
    await taskForm.getByLabel('プロジェクト', { exact: true }).selectOption({ label: projectName })
    await taskForm.getByLabel('タスク名').fill(taskName)
    await taskForm.getByRole('button', { name: '登録する' }).click()
    await expect(page.getByRole('cell', { name: taskName })).toBeVisible()

    // タスク削除 (confirmダイアログ承諾)
    page.on('dialog', dialog => dialog.accept())
    const taskRow = page.getByRole('row').filter({ hasText: taskName })
    await taskRow.getByRole('button', { name: '完全削除' }).click()

    await expect(page.getByRole('cell', { name: taskName })).toHaveCount(0)
  })

  test('プロジェクトを削除すると関連するタスクも消える', async ({ page }) => {
    const projectName = `CascadeDelete_${Date.now()}`
    const taskName = `ChildTask_${Date.now()}`

    // プロジェクト登録
    const projectForm = page.locator('form').filter({ hasText: 'プロジェクト名' })
    await projectForm.getByLabel('プロジェクト名').fill(projectName)
    await projectForm.getByRole('button', { name: '登録する' }).click()

    // タスク登録
    const taskForm = page.locator('form').filter({ has: page.getByLabel('タスク名') })
    await taskForm.getByLabel('プロジェクト', { exact: true }).selectOption({ label: projectName })
    await taskForm.getByLabel('タスク名').fill(taskName)
    await taskForm.getByRole('button', { name: '登録する' }).click()
    await expect(page.getByRole('cell', { name: taskName })).toBeVisible()

    // プロジェクト削除
    page.on('dialog', dialog => dialog.accept())
    const projectRow = page.locator('div').filter({ hasText: projectName }).filter({ has: page.getByRole('button', { name: '削除' }) }).last()
    await projectRow.getByRole('button', { name: '削除' }).click()

    // プロジェクトとタスクの両方が消えていることを確認
    await expect(page.getByText(projectName)).toHaveCount(0)
    await expect(page.getByRole('cell', { name: taskName })).toHaveCount(0)
  })
})
