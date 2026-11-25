# ふりがなの付け方(うさぎクイズ・タイピング)

うさぎクイズ(`usagi-quiz/`)とタイピング(`typing/`)は、画面に出る漢字に **自動で** ふりがなを付けています。
各フォルダの `furigana.js` が、読みの辞書(`FURI_DICT`)を使って画面の文字に `<ruby>` を付けます。

- すでに `<ruby>` が付いている所(タイピングのみことばなど)、入力欄、選択肢(`<option>`)はそのままです
- あとから JavaScript で書きかわった文字にも付きます
- ふりがなを付けたくない所は、その要素に `data-noruby` を付けます
- 数字のあとの「本・日・匹・分」などは、数字に合わせて読みを変えます(3本=ぼん、4日=か など)

## 読みがまちがっていたら

1. `tools/furigana/override_<ゲーム>.json` に `"漢字": "よみ"` を足す(送りがなのある語は漢字の部分の読みだけ。例 `"刈り": "か"`)
2. 辞書を作り直す(Python と `pip install fugashi unidic-lite` が必要)

```
python3 tools/furigana/build_furi.py /tmp/usagi_dict.json usagi-quiz/index.html
python3 tools/furigana/make_furi_js.py /tmp/usagi_dict.json tools/furigana/override_usagi-quiz.json usagi-quiz/furigana.js

python3 tools/furigana/build_furi.py /tmp/typing_dict.json typing/index.html typing/*.js
python3 tools/furigana/make_furi_js.py /tmp/typing_dict.json tools/furigana/override_typing.json typing/furigana.js
```

文章を足したり変えたりしたときも、同じ手順で作り直してください。うさぎクイズは `sw.js` の `VERSION` も1つ上げます。

## 確かめ方

`tools/check_mobile.py` で、幅390pxの画面の小さいボタンと重なりを調べられます(Playwright が必要)。
