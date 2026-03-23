import { test as setup } from '@playwright/test'
import path from 'path'

const adminAuthFile = path.join(__dirname, '.auth/admin.json')
const userAuthFile = path.join(__dirname, '.auth/user.json')

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('メールアドレス').fill('admin@example.com')
  await page.getByLabel('パスワード').fill('password123')
  await page.getByRole('button', { name: 'ログイン', exact: true }).click()
  await page.waitForURL('/')
  await page.context().storageState({ path: adminAuthFile })
})

setup('authenticate as user', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('メールアドレス').fill('user@example.com')
  await page.getByLabel('パスワード').fill('password123')
  await page.getByRole('button', { name: 'ログイン', exact: true }).click()
  await page.waitForURL('/')
  await page.context().storageState({ path: userAuthFile })
})
