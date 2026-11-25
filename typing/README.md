# みことばタイピングクエスト! ― 仕様メモ

- 公開URL:https://koinonia-nagoya.netlify.app/typing/(元の場所:https://boisterous-douhua-5cd90d.netlify.app/)
- 内容:土星うさぎのクックといっしょに、聖書の言葉をローマ字で打つ。パウロの旅の町(マップ)、聖書のボス、時間チャレンジ(30/60/90秒)、2人対戦(PeerJS)、パスポートのスタンプ、ほしあつめ
- 作り:`index.html` + 分割した JS/CSS(`content-data.js` にみことばとローマ字、`quest.js` が今の遊びの中心で `endGame` などを上書きしています)。BGM は直下の `bgm_*.mp3`、絵は `assets/`

## 気をつけること
- `content-data.js` のみことばは、どの訳か書かれていません。例:創世記1:1「初めに、神が天と地を創造された。」。**新改訳2017と照らし合わせて直す必要あり**(未確認)
- 画面の文字はひらがな多め。漢字には `<ruby>` を付ける

## みんなのランキング
- `/api/typing-scores`(`netlify/functions/typing-scores.mjs`)。ボード:30 / 60 / 90(1分で打てた文字数、1〜1200)
- 結果画面で登録、「きろくと パスポート」画面で「みんな/じぶん」を切り替え
- 端末だけの記録(`typingQuestSaveV3` の `rankings`)はそのまま残しています
