/* 迷子の羊をさがせ / Find the lost sheep — shared game script
   Strings come from window.SHEEP_I18N (falls back to Japanese). */
(function(){
  var T=Object.assign({
    round:'ラウンド {n} / {t}', sec:'{s} 秒', best:'ベスト {b}', none:'--',
    found:'見つけた！ {s} 秒', nextMsg:'次の公園では、羊がもっと小さく、すばやくなります。', nextBtn:'次のラウンドへ',
    allFound:'5匹ぜんぶ見つけました！ 合計 {s} 秒', newBest:'(ベスト更新)',
    finalMsg:'「いなくなった一匹を見つけるまで捜し歩く」羊飼いのように、一人ひとりを大切に。もう一度挑戦しますか？',
    again:'もう一度あそぶ', bleat:'メェ〜', hint:'ヒント'
  }, window.SHEEP_I18N||{});
  function f(s,o){return s.replace(/\{(\w+)\}/g,function(_,k){return o[k];});}

  /* ---------- みんなのランキング(/api/sheep-scores) ---------- */
  var RK={
    ja:{rank:'みんなのランキング(合計タイム)',ph:'ニックネーム(12文字まで)',send:'ランキングに登録',note:'ニックネームと合計タイムだけが表示されます。本名は入れないでください。',done:'登録しました!いまは {r} 位',kept:'自己ベストはそのまま({r} 位)',load:'読み込み中…',off:'いまはランキングにつながりません',empty:'まだ記録がありません。最初の1人になろう!',need:'ニックネームを入れてください',fail:'登録できませんでした。少し待ってもう一度お試しください'},
    en:{rank:'Leaderboard (total time)',ph:'Nickname (up to 12 characters)',send:'Add to leaderboard',note:'Only your nickname and total time are shown. Please do not use your real name.',done:'Added! You are #{r}',kept:'Your best time stays (#{r})',load:'Loading…',off:'The leaderboard is not available right now',empty:'No records yet. Be the first!',need:'Please enter a nickname',fail:'Could not add your score. Please wait a moment and try again'},
    es:{rank:'Clasificación (tiempo total)',ph:'Apodo (hasta 12 caracteres)',send:'Agregar a la clasificación',note:'Solo se muestran tu apodo y tu tiempo total. No uses tu nombre real.',done:'¡Agregado! Estás en el puesto {r}',kept:'Se mantiene tu mejor tiempo (puesto {r})',load:'Cargando…',off:'La clasificación no está disponible ahora',empty:'Todavía no hay récords. ¡Sé el primero!',need:'Escribe un apodo',fail:'No se pudo agregar. Espera un momento e inténtalo de nuevo'},
    id:{rank:'Papan peringkat (total waktu)',ph:'Nama panggilan (maks. 12 karakter)',send:'Masukkan ke peringkat',note:'Hanya nama panggilan dan total waktu yang ditampilkan. Jangan pakai nama asli.',done:'Berhasil! Peringkat kamu #{r}',kept:'Waktu terbaikmu tetap (#{r})',load:'Memuat…',off:'Papan peringkat belum bisa dibuka sekarang',empty:'Belum ada catatan. Jadilah yang pertama!',need:'Isi nama panggilan dulu',fail:'Gagal mengirim. Tunggu sebentar lalu coba lagi'},
    ko:{rank:'모두의 랭킹 (합계 시간)',ph:'닉네임 (12자까지)',send:'랭킹에 등록',note:'닉네임과 합계 시간만 표시됩니다. 실명은 쓰지 마세요.',done:'등록했어요! 지금 {r}위',kept:'최고 기록은 그대로예요 ({r}위)',load:'불러오는 중…',off:'지금은 랭킹에 연결할 수 없어요',empty:'아직 기록이 없어요. 첫 번째가 되어 보세요!',need:'닉네임을 입력해 주세요',fail:'등록하지 못했어요. 잠시 후 다시 시도해 주세요'},
    pt:{rank:'Ranking (tempo total)',ph:'Apelido (até 12 caracteres)',send:'Registrar no ranking',note:'Só o apelido e o tempo total aparecem. Não use seu nome verdadeiro.',done:'Registrado! Você está em {r}º',kept:'Seu melhor tempo continua ({r}º)',load:'Carregando…',off:'O ranking não está disponível agora',empty:'Ainda não há recordes. Seja o primeiro!',need:'Digite um apelido',fail:'Não foi possível registrar. Espere um pouco e tente de novo'},
    tl:{rank:'Leaderboard (kabuuang oras)',ph:'Palayaw (hanggang 12 titik)',send:'Ilagay sa leaderboard',note:'Palayaw at kabuuang oras lang ang ipapakita. Huwag gamitin ang tunay mong pangalan.',done:'Naidagdag! Ikaw ay #{r}',kept:'Nanatili ang pinakamabilis mong oras (#{r})',load:'Naglo-load…',off:'Hindi mabuksan ang leaderboard ngayon',empty:'Wala pang record. Ikaw na ang mauna!',need:'Maglagay ng palayaw',fail:'Hindi naidagdag. Maghintay sandali at subukan muli'},
    'zh-hans':{rank:'大家的排行榜(总时间)',ph:'昵称(最多12个字)',send:'登记到排行榜',note:'只显示昵称和总时间。请不要填写真实姓名。',done:'登记成功!现在第 {r} 名',kept:'最佳成绩保持不变(第 {r} 名)',load:'读取中…',off:'现在无法连接排行榜',empty:'还没有记录。来当第一个吧!',need:'请输入昵称',fail:'登记失败,请稍后再试'},
    'zh-hant':{rank:'大家的排行榜(總時間)',ph:'暱稱(最多12個字)',send:'登記到排行榜',note:'只顯示暱稱和總時間。請不要填寫真實姓名。',done:'登記成功!現在第 {r} 名',kept:'最佳成績保持不變(第 {r} 名)',load:'讀取中…',off:'現在無法連接排行榜',empty:'還沒有紀錄。來當第一個吧!',need:'請輸入暱稱',fail:'登記失敗,請稍後再試'}
  };
  function rkLang(){var l=(document.documentElement.lang||'ja').toLowerCase();if(l.indexOf('zh')===0)return /hant|tw|hk/.test(l)?'zh-hant':'zh-hans';l=l.split('-')[0];return RK[l]?l:'ja';}
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function makeBoard(stage,secFmt){
    var L=rkLang(),R=RK[L],API='/api/sheep-scores',nickKey='koinonia-sheep-nick';
    if(!/^https?:$/.test(location.protocol)) return null;
    var box=document.createElement('div');box.className='g-rank';
    box.style.cssText='margin:14px auto 0;max-width:640px;background:#fffdf6;border:1px solid #e6dcc4;border-radius:14px;padding:12px 14px;color:#1F3550;text-align:left';
    box.innerHTML='<b style="display:block;margin-bottom:6px">🐑 '+esc(R.rank)+'</b><div class="g-rk-form" hidden></div><ol class="g-rk-list" style="margin:6px 0 0;padding-left:1.8em;font-size:.95rem;line-height:1.7"></ol><p class="g-rk-msg" style="margin:4px 0 0;font-size:.85rem;color:#2C4560"></p>';
    stage.parentNode.insertBefore(box,stage.nextSibling);
    var list=box.querySelector('.g-rk-list'),form=box.querySelector('.g-rk-form'),msg=box.querySelector('.g-rk-msg'),me='';
    try{me=localStorage.getItem(nickKey)||'';}catch(e){}
    function load(){
      list.innerHTML='<li style="list-style:none;margin-left:-1.8em">'+esc(R.load)+'</li>';
      return fetch(API,{cache:'no-store'}).then(function(r){if(!r.ok)throw 0;return r.json();}).then(function(rows){
        if(!rows.length){list.innerHTML='<li style="list-style:none;margin-left:-1.8em">'+esc(R.empty)+'</li>';return;}
        list.innerHTML=rows.slice(0,10).map(function(x){var b=x.name===me;return '<li'+(b?' style="font-weight:bold;background:#FFF3C9;border-radius:6px"':'')+'>'+esc(x.name)+' — '+esc(secFmt(x.time))+'</li>';}).join('');
      }).catch(function(){list.innerHTML='<li style="list-style:none;margin-left:-1.8em">'+esc(R.off)+'</li>';});
    }
    function offer(total){
      form.hidden=false;msg.textContent='';
      form.innerHTML='<div style="display:flex;gap:8px;flex-wrap:wrap"><input type="text" maxlength="12" autocomplete="nickname" style="flex:1;min-width:10em;min-height:44px;box-sizing:border-box;font:inherit;padding:8px 10px;border:1px solid #cdbf9e;border-radius:10px" placeholder="'+esc(R.ph)+'" value="'+esc(me)+'" aria-label="'+esc(R.ph)+'"><button type="button" class="btn sun">'+esc(R.send)+'</button></div><p style="margin:6px 0 0;font-size:.8rem;color:#5a6b80">'+esc(R.note)+'</p>';
      var inp=form.querySelector('input'),go=form.querySelector('button');
      go.onclick=function(){
        var nk=(inp.value||'').replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,12);
        if(!nk){msg.textContent=R.need;inp.focus();return;}
        me=nk;try{localStorage.setItem(nickKey,nk);}catch(e){}
        go.disabled=true;
        fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:nk,time:Math.round(total*10)/10,lang:L})})
          .then(function(r){if(!r.ok)throw 0;return r.json();})
          .then(function(res){form.hidden=true;msg.textContent=f(res.improved?R.done:R.kept,{r:res.rank});load();})
          .catch(function(){go.disabled=false;msg.textContent=R.fail;});
      };
    }
    function hideForm(){form.hidden=true;}
    load();
    return {offer:offer,hide:hideForm};
  }
  function init(){
    var cv=document.getElementById('g-canvas'); if(!cv||cv.dataset.ready) return; cv.dataset.ready='1';
    var ctx=cv.getContext('2d'), W=cv.width, H=cv.height;
    var over=document.getElementById('g-over'), btn=document.getElementById('g-start');
    var tEl=document.getElementById('g-time'), rEl=document.getElementById('g-round'), bEl=document.getElementById('g-best');
    var title=document.getElementById('g-title'), msg=document.getElementById('g-msg');
    var ROUNDS=5, round=0, total=0, start=0, playing=false, scene=null, marks=[], lastBleat=0, bleatUntil=0, hintUntil=0;
    cv.style.touchAction='manipulation';
    var best=null; try{var v=localStorage.getItem('koinonia-sheep-best'); if(v) best=parseFloat(v);}catch(e){}
    var board=makeBoard(document.getElementById('g-stage')||cv.parentNode,function(t){return f(T.sec,{s:Number(t).toFixed(1)});});
    function showBest(){bEl.textContent=f(T.best,{b:best?f(T.sec,{s:best.toFixed(1)}):T.none});}
    showBest();
    function R(a,b){return a+Math.random()*(b-a);}
    function makeScene(n){
      var s={trees:[],bushes:[],rocks:[],flowers:[]};
      var nt=5+n*2, nr=3+n*2;
      for(var i=0;i<nt;i++) s.trees.push({x:R(60,W-60),y:R(60,H-60),r:R(38,58)});
      for(i=0;i<8+n;i++) s.bushes.push({x:R(30,W-30),y:R(30,H-30),r:R(18,28)});
      for(i=0;i<nr;i++) s.rocks.push({x:R(40,W-40),y:R(40,H-40),rx:R(14,22),ry:R(10,15)});
      for(i=0;i<60;i++) s.flowers.push({x:R(0,W),y:R(0,H),c:['#FFD166','#FF9FB2','#FFFFFF','#B8A6FF'][i%4]});
      // start in the open, then wander between trees
      s.sheep={x:R(80,W-80),y:R(80,H-80),tx:0,ty:0,size:Math.max(0.8,1.25-0.1*n),speed:0.8+n*0.22,wait:20,dir:1};
      s.sheep.tx=s.sheep.x; s.sheep.ty=s.sheep.y;
      return s;
    }
    function pickTarget(sh){
      if(Math.random()<0.55){sh.tx=R(60,W-60);sh.ty=R(60,H-60);}
      else{var t=scene.trees[Math.floor(Math.random()*scene.trees.length)];sh.tx=t.x+R(-t.r*0.9,t.r*0.9);sh.ty=t.y+t.r*0.7;}
    }
    function drawGround(){
      var g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#BFE6A8'); g.addColorStop(1,'#9FD58B');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle='#EAD9B5'; ctx.lineWidth=34; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(-20,H*0.7); ctx.bezierCurveTo(W*0.3,H*0.45,W*0.6,H*0.95,W+20,H*0.55); ctx.stroke();
      ctx.fillStyle='#8CCBEB'; ctx.beginPath(); ctx.ellipse(W*0.78,H*0.22,90,48,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(W*0.76,H*0.2,40,10,0,0,Math.PI*2); ctx.fill();
      scene.flowers.forEach(function(p){ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x,p.y,2.6,0,Math.PI*2); ctx.fill();});
    }
    function drawRock(r){
      ctx.fillStyle='#F4F2EC'; ctx.beginPath(); ctx.ellipse(r.x,r.y,r.rx,r.ry,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(0,0,0,.08)'; ctx.beginPath(); ctx.ellipse(r.x+3,r.y+4,r.rx,r.ry*0.6,0,0,Math.PI*2); ctx.fill();
    }
    function drawSheep(sh,t){
      var s=sh.size, bob=Math.sin(t/120)*1.5;
      ctx.save(); ctx.translate(sh.x,sh.y+bob); ctx.scale(sh.dir*s,s);
      ctx.fillStyle='rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(2,20,22,5,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#3B3B3B'; [-10,-3,5,12].forEach(function(lx){ctx.fillRect(lx,8,3.5,12);});
      ctx.fillStyle='#FFFFFF'; ctx.strokeStyle='rgba(0,0,0,.18)'; ctx.lineWidth=1.5;
      [[-12,0,10],[-4,-6,11],[6,-5,11],[13,1,9],[0,4,12]].forEach(function(c){ctx.beginPath();ctx.arc(c[0],c[1],c[2],0,Math.PI*2);ctx.fill();ctx.stroke();});
      ctx.fillStyle='#FFFFFF'; [[-12,0,9],[-4,-6,10],[6,-5,10],[13,1,8],[0,4,11]].forEach(function(c){ctx.beginPath();ctx.arc(c[0],c[1],c[2],0,Math.PI*2);ctx.fill();});
      ctx.fillStyle='#3B3B3B'; ctx.beginPath(); ctx.ellipse(22,-3,7,9,0.3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#FFFFFF'; ctx.beginPath(); ctx.arc(24,-6,1.6,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
    function drawBubble(sh,text,alpha){
      ctx.save(); ctx.globalAlpha=alpha; ctx.font='bold 22px sans-serif'; ctx.textAlign='center';
      var w=ctx.measureText(text).width+20, x=Math.min(Math.max(sh.x,w/2+4),W-w/2-4), y=Math.max(sh.y-42*sh.size,26);
      ctx.fillStyle='#fff'; ctx.strokeStyle='#1F3550'; ctx.lineWidth=2;
      ctx.beginPath(); if(ctx.roundRect){ctx.roundRect(x-w/2,y-22,w,30,14);}else{ctx.rect(x-w/2,y-22,w,30);} ctx.fill(); ctx.stroke();
      ctx.fillStyle='#1F3550'; ctx.fillText(text,x,y); ctx.restore();
    }
    function drawTree(tr){
      ctx.fillStyle='rgba(0,0,0,.10)'; ctx.beginPath(); ctx.ellipse(tr.x+8,tr.y+10,tr.r,tr.r*0.8,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(58,140,82,.86)'; ctx.beginPath(); ctx.arc(tr.x,tr.y,tr.r,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(98,180,110,.85)'; ctx.beginPath(); ctx.arc(tr.x-tr.r*0.3,tr.y-tr.r*0.3,tr.r*0.55,0,Math.PI*2); ctx.fill();
    }
    function drawBush(b){ctx.fillStyle='rgba(70,150,80,.92)'; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.arc(b.x+b.r*0.7,b.y+4,b.r*0.7,0,Math.PI*2); ctx.fill();}
    function frame(t){
      if(!scene) return;
      var sh=scene.sheep;
      if(playing){
        if(sh.wait>0){sh.wait--;} else {
          var dx=sh.tx-sh.x, dy=sh.ty-sh.y, d=Math.hypot(dx,dy);
          if(d<3){sh.wait=Math.floor(R(20,80)); pickTarget(sh);} else {sh.x+=dx/d*sh.speed; sh.y+=dy/d*sh.speed; if(Math.abs(dx)>1) sh.dir=dx>0?1:-1;}
        }
        var el=performance.now()-start;
        tEl.textContent=f(T.sec,{s:(el/1000).toFixed(1)});
        if(t-lastBleat>4200){lastBleat=t; bleatUntil=t+900;}
      }
      drawGround();
      scene.rocks.forEach(drawRock);
      scene.bushes.forEach(drawBush);
      drawSheep(sh,t);
      scene.trees.forEach(drawTree);
      if(playing && t<bleatUntil) drawBubble(sh,T.bleat,1);
      if(playing && t<hintUntil){ctx.save();ctx.strokeStyle='rgba(245,154,58,'+((hintUntil-t)/1500)+')';ctx.lineWidth=5;ctx.beginPath();ctx.arc(sh.x,sh.y,70,0,Math.PI*2);ctx.stroke();ctx.restore();}
      marks=marks.filter(function(m){return t-m.t<500;});
      marks.forEach(function(m){ctx.strokeStyle='rgba(200,60,40,'+(1-(t-m.t)/500)+')';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(m.x-9,m.y-9);ctx.lineTo(m.x+9,m.y+9);ctx.moveTo(m.x+9,m.y-9);ctx.lineTo(m.x-9,m.y+9);ctx.stroke();});
      requestAnimationFrame(frame);
    }
    function startRound(){
      if(board&&round===0) board.hide();
      scene=makeScene(round); marks=[]; playing=true; start=performance.now(); over.hidden=true; lastBleat=0;
      rEl.textContent=f(T.round,{n:round+1,t:ROUNDS});
    }
    btn.addEventListener('click',function(){ if(round>=ROUNDS){round=0;total=0;} startRound(); });
    var hb=document.getElementById('g-hint');
    if(hb) hb.addEventListener('click',function(){ if(!playing) return; start-=2000; hintUntil=performance.now()+1500; });
    cv.addEventListener('pointerdown',function(e){
      if(!playing) return;
      e.preventDefault();
      var r=cv.getBoundingClientRect(), k=W/r.width, x=(e.clientX-r.left)*k, y=(e.clientY-r.top)*H/r.height, sh=scene.sheep;
      var tol=34*sh.size+8+(e.pointerType==='touch'?22*k:8*k);
      if(Math.hypot(x-(sh.x+6*sh.size*sh.dir),y-sh.y)<tol){
        var sec=(performance.now()-start)/1000; total+=sec; playing=false; round++;
        if(round<ROUNDS){
          title.textContent=f(T.found,{s:sec.toFixed(1)}); msg.textContent=T.nextMsg; btn.textContent=T.nextBtn;
        } else {
          var isBest=!best||total<best; if(isBest){best=total; try{localStorage.setItem('koinonia-sheep-best',String(best));}catch(err){} showBest();}
          title.textContent=f(T.allFound,{s:total.toFixed(1)})+(isBest?T.newBest:'');
          msg.textContent=T.finalMsg; btn.textContent=T.again;
          if(board) board.offer(total);
          rEl.textContent=f(T.round,{n:ROUNDS,t:ROUNDS});
        }
        tEl.textContent=f(T.sec,{s:total.toFixed(1)});
        over.hidden=false; over.style.display='';
      } else {
        start-=1000; marks.push({x:x,y:y,t:performance.now()});
      }
    });
    scene=makeScene(0); requestAnimationFrame(frame);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
