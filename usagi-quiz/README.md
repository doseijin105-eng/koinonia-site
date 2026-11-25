# モフ博士のうさぎクイズ ― 仕様メモ

- 公開URL:https://koinonia-nagoya.netlify.app/usagi-quiz/
- 内容:うさぎのからだ・気持ち・品種のクイズ(写真つき)、今日の5問、ストーリー、うさぎ検定、品種図鑑、ミミの着せ替え
- 作り:`index.html` 1枚 + `icons/`、`manifest.webmanifest` と `sw.js` で「ホーム画面に追加」に対応(オフラインでも遊べる)
- `sw.js` の `VERSION` は、`index.html` を変えたら数字を1つ上げる(古いキャッシュが残らないように)。`/api/` はキャッシュしない

## ふりがな
- 画面の漢字には `furigana.js` が自動でふりがなを付けます(`docs/games/furigana.md`)

## みんなのランキング
- `/api/usagi-scores`(`netlify/functions/usagi-scores.mjs`)。ボード:trivia / photo / peek / survival / exam-basic / exam-mid / exam-adv(スコア 1〜1000)
- `config.js` の Supabase 設定は使っていません(空のまま)。空なら Netlify のランキングを使います

## 素材
- 素材プロンプト集:Claude のドキュメント「モフ博士のうさぎクイズ 素材プロンプト集(Gemini 画像・音楽)」
- 元ファイル:Googleドライブ「自作アプリ › ゲーム制作(素材・管理) / モフ博士のうさぎクイズ」
