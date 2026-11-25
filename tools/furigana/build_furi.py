import re, sys, json, collections, fugashi
tagger=fugashi.Tagger()
K=r'[一-鿿々〆ヶ]'
def hira(s): return ''.join(chr(ord(c)-0x60) if 'ァ'<=c<='ヶ' else c for c in s)
def segs(surface, reading):
    # 漢字の連なりを (.+?) にして、読みに当てはめる
    parts=re.findall(K+'+|[^一-鿿々〆ヶ]+', surface)
    pat=''.join('(.+?)' if re.match(K,p) else re.escape(hira(p)) for p in parts)
    m=re.fullmatch(pat, reading)
    if not m: return [[surface, reading]] if re.search(K,surface) else [[surface,'']]
    out=[];gi=1
    for p in parts:
        if re.match(K,p): out.append([p,m.group(gi)]); gi+=1
        else: out.append([p,''])
    return out
def toks(text):
    res=[]
    for w in tagger(text):
        kana=w.feature.kana
        res.append((w.surface, hira(kana) if kana else None))
    return res
files=sys.argv[2:]; out=sys.argv[1]
src=''.join(open(f,encoding='utf-8').read() for f in files)
RUBY=collections.Counter(re.findall(r'<ruby>([^<]+)<rt>([^<]+)</rt></ruby>',src))
src=re.sub(r'<ruby>([^<]+)<rt>[^<]*</rt></ruby>',r'\1',src)
# 日本語のまとまり(漢字を含むもの)を取り出す。{漢字|よみ} の書き方はそのまま読みとして使う
runs=re.findall(r'[　-ヿ一-鿿々〆ヶ！-～0-9A-Za-z、。！？・ー〜「」『』（）]+', src)
cnt=collections.defaultdict(collections.Counter); MERGED=set()
for r in runs:
    if not re.search(K,r): continue
    t=toks(r); i=0
    while i<len(t):
        s,rd=t[i]
        if not re.search(K,s) or rd is None: i+=1; continue
        # 漢字だけの語が続くときは1つにまとめる(読みの取り違えを減らす)
        S,R=s,rd; j=i+1; merged=False
        # 数字のすぐ後の助数詞(3本、4日 など)は数字ごと覚える
        if i>0 and re.fullmatch(r'[0-9０-９]+',t[i-1][0]) and t[i-1][1]:
            S=t[i-1][0]+S; R=t[i-1][1]+R
        while j<len(t) and t[j][1] and re.fullmatch(K+'+',t[j][0]) and re.fullmatch(K+'+',S[-1:]+'') and re.fullmatch(K+'+',S):
            S+=t[j][0]; R+=t[j][1]; j+=1; merged=True
        if merged: MERGED.add(S)
        cnt[S][json.dumps(segs(S,R),ensure_ascii=False)]+=1
        i=j
d={};conf=[]
for k,c in cnt.items():
    best=c.most_common(1)[0][0]; d[k]=json.loads(best)
    if len(c)>1: conf.append((k,dict(c)))
best={}
for (k,r),c in RUBY.items():
    if re.fullmatch(K+'+',k) and len(k)>=2 and c>best.get(k,('',0))[1]: best[k]=(r,c)
for k,(r,c) in best.items(): d[k]=[[k,r]]
json.dump(d,open(out,'w',encoding='utf-8'),ensure_ascii=False,indent=0)
print(len(d),'keys', len(conf),'conflicts', len(MERGED),'merged')
open(out+'.merged.txt','w',encoding='utf-8').write('\n'.join(k+'\t'+''.join(a+('('+b+')' if b else '') for a,b in d[k]) for k in sorted(MERGED)))
for k,c in conf[:40]: print(' CONF',k,c)
