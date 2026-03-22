import { test, expect } from '@playwright/test'

// このスペックは 'admin' プロジェクト (storageState=admin) で実行される
test.describe('Admin Dashboard (管理者)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('ダッシュボードに管理者メニューが表示される', async ({ page }) => {
    await expect(page.getByText('工数タイムシート')).toBeVisible()
    await expect(page.getByText('管理者メニュー')).toBeVisible()
    await expect(page.getByRole('link', { name: '管理者ダッシュボードへ' })).toBeVisible()
  })

  test('管理者ダッシュボードへのリンクが機能する', async ({ page }) => {
    await page.getByRole('link', { name: '管理者ダッシュボードへ' }).click()
    await expect(page).toHaveURL('/admin')
    await expect(page.getByRole('heading', { name: '管理者ダッシュボード' })).toBeVisible()
  })

  test('各管理メニューへの遷移が機能する', async ({ page }) => {
    // 管理者ダッシュボードへ移動
    await page.goto('/admin')

    const menuItems = [
      { name: 'ユーザー一覧へ', url: '/admin/users', title: 'ユーザー管理' },
      { name: 'タスク一覧へ', url: '/admin/tasks', title: 'タスク管理' },
      { name: '承認画面へ', url: '/admin/approvals', title: '工数承認ダッシュボード' },
      { name: '集計画面へ', url: '/admin/projects/stats', title: 'プロジェクト別工数集計' },
    ]

    for (const item of menuItems) {
      await page.getByRole('link', { name: item.name }).click()
      await expect(page).toHaveURL(item.url)
      await expect(page.getByRole('heading', { name: item.title })).toBeVisible()
      await page.goto('/admin') // ダッシュボードに戻る
    }
  })
})
