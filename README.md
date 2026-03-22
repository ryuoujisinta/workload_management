This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## 認証とシングルサインオン (SSO) の設定

本プロジェクトは **Auth.js (NextAuth.js v5)** を使用しており、GoogleアカウントによるSSOをサポートしています。

### 1. 環境変数の設定
`.env` ファイルに以下の項目を設定してください。

```env
# セッション暗号化用 (npx auth secret で生成可能)
AUTH_SECRET=your-auth-secret

# Google SSO 設定 (Google Cloud Consoleにて取得)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 2. データベースのセットアップ
SSO用のテーブルを作成するためにマイグレーションを実行してください。

```bash
npx prisma migrate dev
```

### 3. Google Cloud Console での設定
1.  [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成します。
2.  「APIとサービス」 > 「認証情報」から **OAuth 2.0 クライアント ID** を作成します。
3.  **承認済みのリダイレクト URI** に以下を追加します：
    - `http://localhost:3000/api/auth/callback/google`

### 4. ユーザーの利用許可（ホワイトリスト）
本システムはセキュリティのため、**管理者が事前に登録したユーザーのみ**がSSOでログインできるようになっています。

1.  管理者アカウントでログインします。
2.  「ユーザー管理」画面にて、新規ユーザーをその人の **Googleメールアドレス** で登録します。
3.  登録されたユーザーは、ログイン画面の「Googleでログイン」ボタンからシステムを利用できるようになります。
