# 一騎当八百 〜ダビデの勇士伝〜 ― 仕様メモ

- 公開URL:https://koinonia-nagoya.netlify.app/ichido800/
- 聖書箇所:サムエル記第二 23章8〜12節、18〜23節(新改訳2017)
- 対象:小学生〜大人。画面の漢字はすべてふりがな付き(`{漢字|よみ}` → `ruby()`)
- 作り:`index.html` 1枚(HTML5 canvas)+ `assets/`(画像 webp、`assets/music/` に BGM)

## 遊び方の要点
- 走りまわって敵を集め、ためて放つ一撃でまとめて倒す。「一度に八百人」が目標
- モード:ストーリー(7章)/タイムアタック/サバイバル/シャンマの畑を守れ
- 勇士5人:ヨシェブ・バシェベテ(回転)、エルアザル(駆けぬけ)、シャンマ(踏みとどまり)、アビシャイ(投げ槍)、ベナヤ(雪の日の一撃)
- 必殺技、アイテム6種、強化(銀貨)、称号22、聖書クイズつき

## 素材
- キャラクターの絵:`<勇士>_idle / run1-3 / spin1-6 / hurt / win .webp`(ヨシェブだけ接頭辞なし)
- エフェクト:`fx_dash / fx_spear / fx_snow / fx_stomp .webp`、必殺技:`cutin_bg.jpg`・`<勇士>_cutin.webp`
- BGM:`assets/music/bgm_title / bgm_story / bgm_crown / bgm_ta / bgm_surv / bgm_field / bgm_boss .mp3`、ジングル:`jingle_clear / jingle_special / jingle_over .mp3`
- 元ファイル:Googleドライブ「ゲーム素材 / 一騎当八百」、進み具合は「一騎当八百 なかま・素材管理表」

## みんなのランキング
- `/api/ikki-scores`(`netlify/functions/ikki-scores.mjs`)。ボード:`ta`(タイム少ない順)・`surv`(スコア)・`field`(WAVE)
- claude.ai に置いた試遊版(https://claude.ai/artifact/3ppJjyfDEL1BWdb6LjBJgn)では、端末の記録だけになります

## これからやりたいこと(メモ)
- タイトル画面のボタンが勇士の絵に重なる点の調整
