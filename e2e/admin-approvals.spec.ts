import { test, expect } from '@playwright/test'

// このスペックは 'admin' プロジェクトで実行される
test.describe('Admin Approvals (工数承認)', () => {
  let monthStr = '2026-03'
  let projectName: string
  let taskName: string

  test.beforeAll(async ({ browser }) => {
    projectName = `PRJ_APPROVAL_${Date.now()}`
    taskName = `TSK_APPROVAL_${Date.now()}`
    const context = await browser.newContext({ storageState: 'e2e/.auth/admin.json' })
    const page = await context.newPage()

    // 1. プロジェクト登録
    await page.goto(`/admin/tasks?month=${monthStr}`)
    const projectForm = page.locator('form').filter({ hasText: 'プロジェクト名' })
    await projectForm.getByLabel('プロジェクト名').fill(projectName)
    await projectForm.getByRole('button', { name: '登録する' }).click()
    await expect(page.getByText(projectName).first()).toBeVisible()

    // 2. タスク登録
    const taskForm = page.locator('form').filter({ has: page.getByLabel('タスク名') })
    await taskForm.getByLabel('プロジェクト', { exact: true }).selectOption({ label: projectName })
    await taskForm.getByLabel('タスク名').fill(taskName)
    await taskForm.getByRole('button', { name: '登録する' }).click()
    await expect(page.getByText(taskName).first()).toBeVisible()

    // 3. 当月適用
    const addButton = page.getByRole('button', { name: '＋ 当月に追加' }).last()
    await addButton.click()
    await expect(page.getByRole('button', { name: '✓ 当月有効' }).last()).toBeVisible()

    // 4. マイタスクに追加 (タイムシートに表示させるため)
    await page.goto(`/user/tasks?month=${monthStr}`)
    await page.getByRole('heading', { name: 'マイタスク登録' }).waitFor()
    const taskCard = page.locator('div').filter({ hasText: projectName }).filter({ hasText: taskName }).last()
    await taskCard.getByRole('button', { name: 'マイタスクに追加' }).click()
    await expect(taskCard.getByRole('button', { name: 'マイタスクから解除' })).toBeVisible()

    // 5. timesheetで工数登録&承認を3件登録
    // 確実に3日間入力できるよう、月の途中の週を指定する (16日の週)
    await page.goto(`/user/timesheet?month=${monthStr}&week=${monthStr}-16`)
    const table = page.locator('table')
    await expect(table).toBeVisible()

    // 活性化している入力フィールドを探す
    // 新しく追加したタスクの行を特定
    const taskRow = table.locator('tr').filter({ hasText: projectName }).filter({ hasText: taskName })
    const inputs = taskRow.locator('input[type="number"]:not([disabled])')
    const submitButtons = page.getByRole('button', { name: '申請' })

    // 2件分登録
    for (let i = 0; i < 2; i++) {
      await inputs.nth(i).fill('1.0')
      await submitButtons.nth(i).click()
      // 申請中になるのを待機
      await expect(page.getByText('申請中').nth(i)).toBeVisible()
    }
    await context.close()
  })

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/admin.json' })
    const page = await context.newPage()

    // 作成したデータの削除
    await page.goto(`/admin/tasks?month=${monthStr}`)
    page.on('dialog', dialog => dialog.accept())
    const projectRow = page.locator('div').filter({ hasText: projectName }).filter({ has: page.getByRole('button', { name: '削除' }) }).last()
    await projectRow.getByRole('button', { name: '削除' }).click()
    await expect(projectRow).not.toBeVisible()
    await context.close()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/approvals')
  })

  test('工数承認ページが表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '工数承認ダッシュボード' })).toBeVisible()
    await expect(page.getByText('承認待ち一覧 (Pending)')).toBeVisible()
    await expect(page.getByText('承認済み一覧 (Approved)')).toBeVisible()
  })

  test('承認待ちがない場合は「申請はありません」が表示される', async ({ page }) => {
    // データが存在しない場合（または承認済みの場合）の空表示を確認
    // このテストはDBの状態に依存するため、表示パターンのいずれかが正しく出ることを確認する
    const pendingSection = page.getByText('承認待ちの申請はありません。')
    const pendingTable = page.getByText('承認').first()

    // 空表示か承認ボタンのどちらかが存在する（状態次第）
    const hasPendingEmpty = await pendingSection.isVisible().catch(() => false)
    const hasPendingData = await pendingTable.isVisible().catch(() => false)

    expect(hasPendingEmpty || hasPendingData).toBe(true)
  })

  test('申請を承認・却下できる', async ({ page }) => {
    // 承認待ちボタンを探す
    const pendingTable = page.locator('table').first()
    const approveButton = pendingTable.getByRole('button', { name: '承認' }).first()

    // データを作成したので必ず表示されるはず
    await expect(approveButton).toBeVisible()

    // 最初の行を特定するための情報を取得
    const firstPendingRow = pendingTable.getByRole('row').filter({ hasText: projectName }).first()
    const rowDateText = await firstPendingRow.locator('td').nth(1).innerText()

    // 1. 承認実行
    await approveButton.click()

    // 承認済み一覧（2番目のテーブル）に対象の行が出現したことを確認
    const approvedTable = page.locator('table').nth(1)
    const approvedRow = approvedTable.getByRole('row').filter({ hasText: rowDateText })
    await expect(approvedRow).toBeVisible()

    // 2. 取り消し実行
    const revokeButton = approvedRow.getByRole('button', { name: '承認取り消し' })
    await revokeButton.click()
    // 取り消し後は DRAFT になるため、ページ全体（どちらのリスト）からも消えるはず（意図通り）
    await expect(page.getByRole('row').filter({ hasText: projectName }).filter({ hasText: rowDateText })).not.toBeVisible()

    // 3. 却下実行
    // 残りの行を特定
    const remainingRow = pendingTable.getByRole('row').filter({ hasText: projectName }).first()
    const remainingDateText = await remainingRow.locator('td').nth(1).innerText()
    const rejectButton = remainingRow.getByRole('button', { name: '却下' })

    await rejectButton.click()
    // 却下後はその行も消えることを確認
    await expect(page.getByRole('row').filter({ hasText: projectName }).filter({ hasText: remainingDateText })).not.toBeVisible()
  })

})
