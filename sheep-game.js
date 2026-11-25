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
  function init(){
    var cv=document.getElementById('g-canvas'); if(!cv||cv.dataset.ready) return; cv.dataset.ready='1';
    var ctx=cv.getContext('2d'), W=cv.width, H=cv.height;
    var over=document.getElementById('g-over'), btn=document.getElementById('g-start');
    var tEl=document.getElementById('g-time'), rEl=document.getElementById('g-round'), bEl=document.getElementById('g-best');
    var title=document.getElementById('g-title'), msg=document.getElementById('g-msg');
    var ROUNDS=5, round=0, total=0, start=0, playing=false, scene=null, marks=[], lastBleat=0, bleatUntil=0, hintUntil=0;
    cv.style.touchAction='manipulation';
    var best=null; try{var v=localStorage.getItem('koinonia-sheep-best'); if(v) best=parseFloat(v);}catch(e){}
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
