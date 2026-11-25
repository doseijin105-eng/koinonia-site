# 聖書クイズ ― 仕様メモ

- 公開URL:https://koinonia-nagoya.netlify.app/bible-quiz/
- 内容:4択10問。レベル(かんたん/ふつう/むずかしい)・テーマ(人物・たとえ話・できごと・聖書の基本・手紙)・書(旧約39巻・新約の手紙21巻)を選べる。解説と聖書箇所つき、復習、称号
- 聖書:**新改訳2017**の書名・人名に合わせる。問題は全325問
- ふりがな:問題文などは `{漢字|よみ}` で書き、`R()` で `<ruby>` に変換。画面の「ふりがな」切り替えあり

## 問題の直し方
- 問題は `index.html` の中の `<script type="application/json" id="qdata">` にまとまっています(id, q, answer, wrong[3], cat, theme, level, ref, note, book)
- 追加・修正したら、聖書箇所と答えを新改訳2017で確かめる。選択肢4つが重ならないこと
- 「問題を追加・編集する」画面は claude.ai 版(https://claude.ai/artifact/2GGx9SHeXhhDWeE8GbKFer)でだけ動きます。サイト版では直接 `qdata` を直します

## みんなのランキング
- `/api/bible-scores`(`netlify/functions/bible-scores.mjs`)。累計正解数で競う。端末ごとに1行、正解数は増える方向だけ、1回で10問より多くは増えない
