/* 画面の漢字に自動でふりがなを付ける(辞書はこのファイルの FURI_DICT)。
   ・<ruby> がすでにある所、入力欄、選択肢(<option>)、data-noruby を付けた所は変えない
   ・あとから JavaScript で書きかわった文字にも付ける(MutationObserver)
   ・辞書を直すときは docs の手順で作り直す(tools/build_furi.py) */
(function(){
  "use strict";
  var D = FURI_DICT, byFirst = new Map();
  Object.keys(D).forEach(function(k){ var c=k[0]; if(!byFirst.has(c)) byFirst.set(c,[]); byFirst.get(c).push(k); });
  byFirst.forEach(function(list){ list.sort(function(a,b){ return b.length-a.length; }); });
  var KAN = /[一-鿿々〆ヶ]/;
  // 数字のあとの数えかた(3本、4日 など)。数字によって読みが変わるものは関数で決める
  var last = function(n){ n=String(n).replace(/[０-９]/g,function(d){return String.fromCharCode(d.charCodeAt(0)-0xFEE0);}); return +n.slice(-1); };
  var p3 = function(h,b,p){ return function(n){ var d=last(n); return [1,6,8,0].indexOf(d)>=0?p:d===3?b:h; }; };
  var COUNTER = [
    ["時間","じかん"],["週間","しゅうかん"],["か月","げつ"],["ヶ月","げつ"],["種類","しゅるい"],["文字","もじ"],["問目","もんめ"],["回目","かいめ"],["番目","ばんめ"],["年間","ねんかん"],["年代","ねんだい"],["日間",function(n){n=+String(n).replace(/[０-９]/g,function(d){return String.fromCharCode(d.charCodeAt(0)-0xFEE0);});return ((n>=2&&n<=10)||n===14||n===20||n===24?"か":"にち")+"かん";}],["色型","しょくがた"],["分間",function(n){var d=last(n);return [1,3,4,6,8,0].indexOf(d)>=0?"ぷんかん":"ふんかん";}],["秒間","びょうかん"],
    ["本",p3("ほん","ぼん","ぽん")],["匹",p3("ひき","びき","ぴき")],["杯",p3("はい","ばい","ぱい")],["分",function(n){var d=last(n);return [1,3,4,6,8,0].indexOf(d)>=0?"ぷん":"ふん";}],
    ["日",function(n){n=+String(n).replace(/[０-９]/g,function(d){return String.fromCharCode(d.charCodeAt(0)-0xFEE0);});return (n>=2&&n<=10)||n===14||n===20||n===24?"か":"にち";}],
    ["人",function(n){n=+String(n).replace(/[０-９]/g,function(d){return String.fromCharCode(d.charCodeAt(0)-0xFEE0);});return n===1||n===2?"り":"にん";}],
    ["年","ねん"],["月","がつ"],["歳","さい"],["才","さい"],["回","かい"],["個","こ"],["枚","まい"],["問","もん"],["度","ど"],["倍","ばい"],["秒","びょう"],["時","じ"],["羽","わ"],["頭","とう"],["点","てん"],["位","い"],["番","ばん"],["階","かい"],["件","けん"],["冊","さつ"],["章","しょう"],["島","とう"],["種","しゅ"],["割","わり"],["歩","ほ"],["万","まん"],["億","おく"],["千","せん"],["百","ひゃく"],["色","しょく"]
  ];
  function esc(s){ return s.replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }
  function rb(t,r){ return "<ruby>"+esc(t)+"<rt>"+esc(r)+"</rt></ruby>"; }
  function annotate(text){
    var out="", i=0, changed=false;
    while(i<text.length){
      var ch=text[i];
      if(KAN.test(ch)){
        var m=/[0-9０-９]+$/.exec(text.slice(Math.max(0,i-8),i));
        if(m){
          var hit=null;
          for(var c=0;c<COUNTER.length;c++){ if(text.startsWith(COUNTER[c][0],i)){ hit=COUNTER[c]; break; } }
          if(hit){ var r=typeof hit[1]==="function"?hit[1](m[0]):hit[1]; out+= r? rb(hit[0],r) : esc(hit[0]); i+=hit[0].length; changed=true; continue; }
        }
      }
      // カタカナのあとの「人」「島」「内」(アメリカ人、スマトラ島、テーマ内)
      if((ch==="人"||ch==="島"||ch==="内")&&i>0&&/[ァ-ヶー]/.test(text[i-1])&&!(byFirst.get(ch)||[]).some(function(k){return k.length>1&&text.startsWith(k,i);})){ out+=rb(ch,{"人":"じん","島":"とう","内":"ない"}[ch]); i++; changed=true; continue; }
      var list=byFirst.get(ch), found=null;
      if(list){ for(var j=0;j<list.length;j++){ if(text.startsWith(list[j],i)){ found=list[j]; break; } } }
      if(found){ D[found].forEach(function(s){ out+= s[1]? rb(s[0],s[1]) : esc(s[0]); }); i+=found.length; changed=true; continue; }
      out+=esc(ch); i++;
    }
    return changed?out:null;
  }
  var SKIP={SCRIPT:1,STYLE:1,TEXTAREA:1,INPUT:1,SELECT:1,OPTION:1,RUBY:1,RT:1,RP:1,NOSCRIPT:1,TITLE:1,CANVAS:1,svg:1,CODE:1};
  function skipped(n){ for(var e=n.parentNode;e&&e.nodeType===1;e=e.parentNode){ if(SKIP[e.tagName]||e.isContentEditable||e.hasAttribute("data-noruby")) return true; } return false; }
  function doText(t){
    if(!t.parentNode||!KAN.test(t.data)||skipped(t)) return;
    var html=annotate(t.data); if(html===null) return;
    var tpl=document.createElement("template"); tpl.innerHTML=html;
    t.parentNode.replaceChild(tpl.content,t);
  }
  function walk(root){
    if(root.nodeType===3){ doText(root); return; }
    if(root.nodeType!==1||SKIP[root.tagName]||(root.hasAttribute&&root.hasAttribute("data-noruby"))) return;
    var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT), list=[], n;
    while((n=w.nextNode())) if(KAN.test(n.data)) list.push(n);
    list.forEach(doText);
  }
  var obs=new MutationObserver(function(recs){
    obs.disconnect();
    recs.forEach(function(r){ if(r.type==="characterData") doText(r.target); else r.addedNodes.forEach(walk); });
    obs.takeRecords();
    obs.observe(document.body,{childList:true,subtree:true,characterData:true});
  });
  function start(){ walk(document.body); obs.observe(document.body,{childList:true,subtree:true,characterData:true}); }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start); else start();
  window.furiganaAnnotate=annotate;
})();
