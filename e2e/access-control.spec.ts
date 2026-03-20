import { test, expect } from '@playwright/test'

// このスペックは 'no-auth' プロジェクト（認証なし）で実行される
test.describe('Access Control (アクセス制御)', () => {
  test('未ログイン状態でトップページにアクセスすると /login にリダイレクトされる', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/login')
  })

  test('未ログイン状態で /admin にアクセスすると /login にリダイレクトされる', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL('/login')
  })

  test('未ログイン状態で /user/timesheet にアクセスすると /login にリダイレクトされる', async ({ page }) => {
    await page.goto('/user/timesheet')
    await expect(page).toHaveURL('/login')
  })

  test('一般ユーザーで /admin にアクセスすると / にリダイレクトされる', async ({ page }) => {
    // まず一般ユーザーでログイン
    await page.goto('/login')
    await page.getByLabel('メールアドレス').fill('user@example.com')
    await page.getByLabel('パスワード').fill('password123')
    await page.getByRole('button', { name: 'ログイン' }).click()
    await page.waitForURL('/')

    // 管理者ページへの不正アクセスを試みる
    await page.goto('/admin')
    await expect(page).toHaveURL('/')
  })
})
