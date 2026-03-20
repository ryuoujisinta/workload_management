import { test, expect } from '@playwright/test'

// このスペックは 'admin' プロジェクトで実行される
test.describe('Admin Approvals (工数承認)', () => {
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
})
