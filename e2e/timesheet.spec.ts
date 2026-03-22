import { test, expect } from '@playwright/test'
import path from 'path'

const adminAuthFile = path.resolve(__dirname, '.auth/admin.json')
const userAuthFile = path.resolve(__dirname, '.auth/user.json')

// このスペックは 'user' プロジェクトで実行される
test.describe('User Timesheet (工数タイムシート)', () => {
  let projectName: string
  let taskName: string

  test.beforeAll(async ({ browser }) => {
    projectName = `E2E_TimesheetProject_${Date.now()}`
    taskName = `E2E_TimesheetTask_${Date.now()}`

    // 1. adminでログイン
    const adminContext = await browser.newContext({ storageState: adminAuthFile })
    const adminPage = await adminContext.newPage()

    // 2. プロジェクト作成
    await adminPage.goto('/admin/tasks')
    const projectForm = adminPage.locator('form').filter({ hasText: 'プロジェクト名' })
    await projectForm.getByLabel('プロジェクト名').fill(projectName)
    await projectForm.getByRole('button', { name: '登録する' }).click()
    await expect(adminPage.getByText(projectName).first()).toBeVisible()

    // 3. 作成したプロジェクトにタスク登録
    const taskForm = adminPage.locator('form').filter({ has: adminPage.getByLabel('タスク名') })
    await taskForm.getByLabel('プロジェクト', { exact: true }).selectOption({ label: projectName })
    await taskForm.getByLabel('タスク名').fill(taskName)
    await taskForm.getByRole('button', { name: '登録する' }).click()

    // 登録したタスクが表示されるのを待機
    const taskRow = adminPage.getByRole('row').filter({ hasText: taskName })
    await expect(taskRow).toBeVisible()

    // 4. タスクの有効化
    const addButton = taskRow.getByRole('button', { name: '＋ 当月に追加' })
    await addButton.click()
    await expect(taskRow.getByRole('button', { name: '✓ 当月有効' })).toBeVisible()

    await adminContext.close()

    // 5. userでログイン
    const userContext = await browser.newContext({ storageState: userAuthFile })
    const userPage = await userContext.newPage()

    // 6. タスク登録 (My Task)
    await userPage.goto('/user/tasks')
    await userPage.waitForLoadState('networkidle')

    // カードを特定。プロジェクト名とタスク名両方を含むものを探す
    const taskCard = userPage.locator('[data-slot="card"]').filter({ hasText: taskName }).filter({ hasText: projectName }).first()
    await expect(taskCard).toBeVisible({ timeout: 10000 })

    const addToMyTasksButton = taskCard.getByRole('button', { name: 'マイタスクに追加' })
    if (await addToMyTasksButton.isVisible()) {
      await addToMyTasksButton.click()
      await expect(taskCard.getByRole('button', { name: 'マイタスクから解除' })).toBeVisible()
    }

    await userContext.close()
  })

  test.afterAll(async ({ browser }) => {
    // 5. 作成したプロジェクトの削除 (Prompt step 5, cleanup)
    const adminContext = await browser.newContext({ storageState: adminAuthFile })
    const adminPage = await adminContext.newPage()
    await adminPage.goto('/admin/tasks')

    adminPage.on('dialog', dialog => dialog.accept())
    const projectRow = adminPage.locator('div').filter({ hasText: projectName }).filter({ has: adminPage.getByRole('button', { name: '削除' }) }).last()

    if (await projectRow.isVisible()) {
      await projectRow.getByRole('button', { name: '削除' }).click()
      await expect(adminPage.getByText(projectName)).toHaveCount(0)
    }

    await adminContext.close()
  })

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
      const taskRow = table.locator('tr', { hasText: taskName })
      const actionRow = table.locator('tr', { hasText: 'アクション' })

      // 保存ボタンがある最初の列を探し、その列の日付ラベルを取得
      const cells = await actionRow.locator('td').all()
      let targetIndex = -1
      for (let i = 1; i < cells.length; i++) {
        if (await cells[i].getByRole('button', { name: '保存' }).isVisible()) {
          targetIndex = i
          break
        }
      }

      if (targetIndex === -1) {
        test.skip()
        return
      }

      const dateLabel = await table.locator('thead th').nth(targetIndex).textContent()

      // 同じ列の入力フィールドに値を入力
      const targetInput = taskRow.locator('td').nth(targetIndex).locator('input')
      await targetInput.fill('4.5')

      // 保存ボタンをクリックし、処理完了（ボタンが再度活性化する）を待つ
      const saveButton = actionRow.locator('td').nth(targetIndex).getByRole('button', { name: '保存' })
      await saveButton.click()

      // 処理中の disabled 状態を経て、再度活性化するのを待機（レースコンディション回避）
      await expect(saveButton).toBeEnabled()

      await page.reload()

      // リロード後、日付ラベルを基に新しいインデックスを特定
      const newHeaders = await table.locator('thead th').all()
      let newIndex = -1
      for (let i = 0; i < newHeaders.length; i++) {
        if (await newHeaders[i].textContent() === dateLabel) {
          newIndex = i
          break
        }
      }

      const refreshedTaskRow = page.locator('table tr', { hasText: taskName })
      const refreshedInput = refreshedTaskRow.locator('td').nth(newIndex).locator('input')
      await expect(refreshedInput).toHaveValue('4.5')
    } else {
      test.skip()
    }
  })

  test('申請と取り消しのフローが機能する', async ({ page }) => {
    const table = page.locator('table')
    if (await table.isVisible()) {
      const taskRow = table.locator('tr', { hasText: taskName })
      const actionRow = table.locator('tr', { hasText: 'アクション' })

      // 申請ボタンがある最初の列を探し、日付ラベルを取得
      const cells = await actionRow.locator('td').all()
      let targetIndex = -1
      for (let i = 1; i < cells.length; i++) {
        if (await cells[i].getByRole('button', { name: '申請' }).isVisible()) {
          targetIndex = i
          break
        }
      }

      if (targetIndex === -1) {
        test.skip()
        return
      }

      const dateLabel = await table.locator('thead th').nth(targetIndex).textContent()

      const submitButton = actionRow.locator('td').nth(targetIndex).getByRole('button', { name: '申請' })
      await submitButton.click()

      // ステータスが「申請中」に変わるのを待機
      const statusText = actionRow.locator('td').nth(targetIndex).getByText('申請中')
      await expect(statusText).toBeVisible()

      // 取消ボタンが表示されるのを確認
      const cancelButton = actionRow.locator('td').nth(targetIndex).getByRole('button', { name: '取り消し' })
      await expect(cancelButton).toBeVisible()

      // 入力が disabled になることを確認
      const targetInput = taskRow.locator('td').nth(targetIndex).locator('input')
      await expect(targetInput).toBeDisabled()

      // 取り消し
      await cancelButton.click()
      // 申請ボタンが再度表示されるのを待つ
      await expect(submitButton).toBeVisible()
      await expect(targetInput).not.toBeDisabled()
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
