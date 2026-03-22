# 工数管理システム (Workload Management System)

このプロジェクトは、従業員の工数（作業時間）をプロジェクトおよびタスク単位で管理・集計するためのシステムです。
Next.js (App Router) をベースに、Auth.js による認証と Prisma によるデータベース管理を組み合わせて構築されています。

## 主な機能

### 管理者向け機能
- **ユーザー管理**: システムを利用できるユーザーの登録・管理（ホワイトリスト形式）。
- **プロジェクト管理**: プロジェクトの定義および年度ごとの管理。
- **タスク管理**: プロジェクトに紐づくタスクの登録、および月ごとの有効化。
- **工数承認**: ユーザーから提出された工数データの確認、承認および却下。
- **集計・レポート**: プロジェクト別やユーザー別の工数実績を年度・月単位で集計し、統計情報を表示。

### 一般ユーザー向け機能
- **マイタスク登録**: その月に自分が担当するタスクを、管理者によって定義されたタスク群から選択・登録。
- **工数入力（タイムシート）**: 登録したマイタスクに対して、日ごとの作業時間を入力（週次/月次ビュー）。
- **ステータス管理**: 入力した工数の提出、および承認状況の確認。

## 技術スタック

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Authentication**: [Auth.js (v5)](https://authjs.dev/)
- **Database**: [Prisma](https://www.prisma.io/) (PostgreSQL)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Testing**: [Playwright](https://playwright.dev/) (E2E), [Jest](https://jestjs.io/) (Unit)

---

## セットアップ手順

### 1. 環境変数の設定

`.env` ファイルを作成し、以下の項目を設定してください。

```env
# データベース接続 (例: PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/workload_db"

# セッション暗号化用 (npx auth secret で生成可能)
AUTH_SECRET="your-auth-secret"

# Google SSO 設定 (Google Cloud Consoleにて取得)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 2. データベースのセットアップ

Prismaを使用してデータベーススキーマを反映します。

```bash
npx prisma migrate dev
```

### 3. Google Cloud Console での設定 (SSO用)

1.  [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成します。
2.  「APIとサービス」 > 「認証情報」から **OAuth 2.0 クライアント ID** を作成します。
3.  **承認済みのリダイレクト URI** に以下を追加します：
    - `http://localhost:3000/api/auth/callback/google`

### 4. 初回ユーザー登録とログイン許可

本システムはセキュリティのため、**管理者のホワイトリストに登録されたメールアドレスのみ**がログインできるようになっています。最初にシステムを利用するためには、初期ユーザーを作成する必要があります。

1.  以下のコマンドを実行して、初期ユーザー（管理者・一般ユーザー）を作成します。
    ```bash
    npx tsx scripts/seed.ts
    ```
    - **管理者**: `admin@example.com`（パスワード: `password123`）
    - **一般ユーザー**: `user@example.com`（パスワード: `password123`）
2.  ログイン画面から、上記の管理者アカウントでログインします（メールアドレスとパスワードでログイン）。
3.  「ユーザー管理」画面にて、新規ユーザーをその人の **Googleメールアドレス** で登録します。登録されたユーザーは、次回から Google SSO でログイン可能になります。

---

## 開発用コマンド

```bash
# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# ユニットテストの実行
npm run test

# E2Eテストの実行
npx playwright test

# Prisma Studio の起動 (DBの中身を確認)
npx prisma studio
```
