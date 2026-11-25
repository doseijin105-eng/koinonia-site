import json,sys,re
d=json.load(open(sys.argv[1],encoding='utf-8')); ov=json.load(open(sys.argv[2],encoding='utf-8'))
for k,v in ov.items():
    if v is None: d.pop(k,None)
    elif isinstance(v,str):
        parts=re.findall(r'[\u4e00-\u9fff々〆ヶ]+|[^\u4e00-\u9fff々〆ヶ]+',k)
        kr=[p for p in parts if re.match(r'[\u4e00-\u9fff々〆ヶ]',p)]
        d[k]=[[p,v] if re.match(r'[\u4e00-\u9fff々〆ヶ]',p) else [p,''] for p in parts] if len(kr)==1 else [[k,v]]
    else: d[k]=v
# 読みが漢字だけを含む語の送りがなを保つ: 辞書の値がひとまとまりで、送りがな付きなら分ける
import re
K=r'[一-鿿々〆ヶ]'
for k,v in list(d.items()):
    if len(v)==1 and v[0][1] and re.search(r'[ぁ-ん]$',k) and not re.search(r'[ぁ-ん]$',v[0][1] or ''):
        pass
eng=open('tools/furigana/furigana_engine.js',encoding='utf-8').read()
out=sys.argv[3]
open(out,'w',encoding='utf-8').write('/* 自動で作った読みの辞書('+str(len(d))+'語)。直し方は docs/games/furigana.md */\nvar FURI_DICT='+json.dumps(d,ensure_ascii=False,separators=(',',':'))+';\n'+eng)
print(out, len(d))
