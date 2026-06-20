<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:git-commit-rules -->
# Git commit rules

Before committing, you MUST ALWAYS check the modification details using `git diff` and `git status` to verify that the changes match your intentions.
Additionally, you MUST NOT perform file modifications and `git commit` in the same step. You must first apply the modifications, verify them using `git status` and `git diff`, and then perform the `git commit` in a separate subsequent step.
<!-- END:git-commit-rules -->

<!-- BEGIN:shell-rules -->
# Shell rules

Windows環境では、コマンドは基本的に `cmd /c` を介して実行してください。

## Windows shell pitfalls

- 実行シェル自体は PowerShell です。`cmd /c` の引数に `|`、`&`、`>`、`<`、括弧、正規表現の `|` を含めると、引用符の状態によっては PowerShell が先に解釈します。検索条件は `rg -e pattern1 -e pattern2` のように分け、複雑なコマンドは1本に連結せず個別に実行してください。
- `cmd /c "command1 & command2"` のような複数コマンド実行は避けてください。特にツール呼び出しでは各コマンドを別々に実行し、可能なら並列実行してください。
- Windows PowerShell 5 の `Get-Content` と `Set-Content` は、既定の文字コードでUTF-8ファイルを読み書きすると日本語を文字化けさせる場合があります。ソースファイルの編集には `apply_patch` を使用してください。やむを得ずPowerShellで扱う場合は、読み込みに `[System.IO.File]::ReadAllText(path, [System.Text.Encoding]::UTF8)`、書き込みに BOM なしの `[System.Text.UTF8Encoding]::new($false)` を明示してください。
- PowerShellのヒアストリングや複数行文字列を `cmd /c` のコマンド引数として渡さないでください。改行や末尾行が失われる場合があります。
- コマンド失敗後は、ファイル変更の有無を `git status --short` と `git diff --check` で確認してください。文字コードを含む編集後は必ず `git diff` も確認してください。
<!-- END:shell-rules -->
