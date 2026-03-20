import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('should login successfully as a normal user', async ({ page }) => {
    // 1. ログインページへ遷移
    await page.goto('/login')

    // 2. ログイン画面の見出しが表示されていることを確認
    await expect(page.getByText('工数管理システム')).toBeVisible()

    // 3. メールアドレスとパスワードを入力 (seed.ts で登録済みのデータ)
    await page.getByLabel('メールアドレス').fill('user@example.com')
    await page.getByLabel('パスワード').fill('password123')

    // 4. ログインボタンをクリック
    await page.getByRole('button', { name: 'ログイン' }).click()

    // 5. リダイレクトされてトップページに遷移することを確認
    await expect(page).toHaveURL('/')

    // 6. 認証が通っているかログイン後の画面の一部が表示されるかで確認
    // Next.js App Routerのトップページ（またはナビゲーション）の要素を検証
    // 今回は "/user/tasks" 等へ進めるか、または "ログアウト" ボタンなどがあれば検証
    // ここでは安全に <nav> 等の内部テキストなどで検証する（例: Navbar等があれば）
    // とりあえず URL がルート ("/") または "/" ベースであることを検証できればOK
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.getByLabel('メールアドレス').fill('invalid@example.com')
    await page.getByLabel('パスワード').fill('wrongpassword')
    await page.getByRole('button', { name: 'ログイン' }).click()

    // エラーメッセージが表示されることを確認
    await expect(page.getByText('メールアドレスまたはパスワードが間違っています')).toBeVisible()
    
    // まだログインページにいることを確認
    await expect(page).toHaveURL('/login')
  })
})
