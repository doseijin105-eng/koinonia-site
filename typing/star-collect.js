/* Accuracy-driven rewards for Cook's 60-second star challenge. */
'use strict';
let starRound=null;
const starSources={beginner:{name:'しょきゅうの たんご',icon:'🌱'},verses:{name:'せいしょ',icon:'📖'},quotes:{name:'神学者・偉人のことば',icon:'💡'},anime:{name:'漫画・アニメ',icon:'🎬'}};
function starQuestions(source){return source==='beginner'?BeginnerWords:source==='verses'?versesData:source==='quotes'?QuestContent.theologianQuotes:source==='anime'?QuestContent.animeQuotes:[];}
function isStarChallenge(){return questState.replay?.mode==='stars';}
function starRecord(source){
 const a=progress.adventure;
 if(!a.starCollect||typeof a.starCollect!=='object'||Array.isArray(a.starCollect))a.starCollect={};
 if(!a.starCollect[source]||typeof a.starCollect[source]!=='object'||Array.isArray(a.starCollect[source]))a.starCollect[source]={};
 const record=a.starCollect[source];
 for(const name of ['best','last','plays','total','maxLevel'])if(!Number.isSafeInteger(record[name])||record[name]<0)record[name]=0;
 return record;
}
window.openStarCollect=function(){
 for(const source of Object.keys(starSources))el('star-choice-'+source).textContent=`${starQuestions(source).length}もん · いちばんの きろく ${starRecord(source).best.toLocaleString()}こ`;
 showScreen('screen-star-select');playBGM('menu');
};
const starMotion={score:null,cook:null,banner:null};
function clearStarEffects(){
 el('star-effects').innerHTML='';el('star-scene').innerHTML='';
 for(const key of Object.keys(starMotion)){starMotion[key]?.cancel?.();starMotion[key]=null;}
 el('star-burst-text').textContent='';
}
function renderStarRound(){
 if(!starRound)return;
 const need=StarCollectCore.needed(starRound.level),bar=el('star-growth');
 el('star-score').textContent=starRound.score.toLocaleString();el('star-level').textContent=starRound.level;
 el('star-per-key').textContent=`1文字で ${starRound.level}こ`;
 bar.style.width=(need?starRound.xp/need*100:100)+'%';
 el('star-growth-meter').setAttribute('aria-valuemax',String(need||1));el('star-growth-meter').setAttribute('aria-valuenow',String(need?starRound.xp:1));
 el('star-growth-text').textContent=need?`つぎのレベルまで ${need-starRound.xp} ポイント`:'あつめる力が さいこうになったよ！';
 el('star-bonus').textContent=starRound.bonus>1?`そだちボーナス ${starRound.bonus}ばい`:'れんぞく20文字で ボーナス';
 el('star-bonus').dataset.active=String(starRound.bonus>1);
 el('star-accuracy').textContent=Core.metrics(totalKeyCount,missCount,1000).accuracy+'%';
 el('star-cook').src=starRound.bonus>1?'assets/cook_combo.webp':'assets/cook_default.webp';
 el('star-stage-energy').textContent=starRound.bonus>1?'✦'.repeat(starRound.bonus):'✧';
 el('star-hud').dataset.energy=String(starRound.bonus);
}
const starPalette=['#d89113','#2ca5ca','#af66d3','#e36a91'];
function addStarParticle(layer,kind,earned=0){
 const scene=layer.id==='star-scene',limit=scene?48:32;
 while(layer.childElementCount>=limit)layer.firstElementChild.remove();
 const p=document.createElement('span');p.className=scene?'scene-star '+(kind==='comet'?'scene-comet':'scene-spark'):'collected-star '+(kind==='burst'?'burst-star':'');
 p.textContent=earned?'✦ +'+earned:Math.random()>.4?'✦':'✧';
 p.style.setProperty('--star-color',starPalette[Math.floor(Math.random()*starPalette.length)]);
 p.style.setProperty('--star-x',(scene?(Math.random()>.5?88+Math.random()*10:2+Math.random()*10):18+Math.random()*66)+'%');
 p.style.setProperty('--star-y',(8+Math.random()*65)+'%');p.style.setProperty('--star-drift',(-95+Math.random()*190)+'px');
 p.style.setProperty('--star-rise',(-85-Math.random()*135)+'px');p.style.setProperty('--star-turn',(-100+Math.random()*200)+'deg');
 p.style.setProperty('--star-size',(scene?19+Math.random()*16:22+Math.random()*13)+'px');
 p.style.setProperty('--star-delay',(kind==='burst'?Math.random()*.18:0)+'s');
 p.addEventListener('animationend',()=>p.remove(),{once:true});layer.appendChild(p);
}
function animateStarNode(key,node,frames,duration){
 starMotion[key]?.cancel?.();starMotion[key]=node.animate?.(frames,{duration,easing:'cubic-bezier(.2,.8,.3,1)'});
}
function popCollectedStar(earned){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 for(let i=0;i<3;i++)addStarParticle(el('star-effects'),'spark',i===0?earned:0);
 addStarParticle(el('star-scene'),'comet');
 animateStarNode('score',el('star-score'),[{transform:'scale(1.16)',color:'#d99811'},{transform:'scale(1)',color:'#8c5b0c'}],180);
 animateStarNode('cook',el('star-cook'),[{transform:'translateY(0) rotate(-3deg)'},{transform:'translateY(-12px) rotate(5deg)'},{transform:'translateY(0) rotate(-3deg)'}],300);
}
function celebrateStarRound(kind){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const big=kind!=='word';
 for(let i=0;i<(big?24:10);i++)addStarParticle(el('star-scene'),i%3===0?'comet':'burst');
 for(let i=0;i<(big?14:6);i++)addStarParticle(el('star-effects'),'burst');
 if(kind==='level'||kind==='bonus'){
  el('star-burst-text').textContent=kind==='level'?`レベル${starRound.level}に アップ！`:`ボーナス ${starRound.bonus}ばい！`;
  animateStarNode('banner',el('star-burst-banner'),[{opacity:0,transform:'translate(-50%,12px) scale(.65)'},{opacity:1,transform:'translate(-50%,-4px) scale(1.08)',offset:.16},{opacity:1,transform:'translate(-50%,0) scale(1)',offset:.7},{opacity:0,transform:'translate(-50%,-18px) scale(.95)'}],1400);
  el('star-cook').src='assets/cook_victory.webp';
 }
 animateStarNode('cook',el('star-cook'),[{transform:'translateY(0) rotate(-5deg)'},{transform:'translateY(-22px) rotate(8deg)',offset:.4},{transform:'translateY(0) rotate(-5deg)'}],650);
}
window.startStarCollect=function(source='verses'){
 if(!starSources[source])return;
 const pool=starQuestions(source);if(!pool.length){notifyQuest('このことばは まだないよ。べつのことばを えらぼう。');return;}
 starRound=StarCollectCore.create();clearStarEffects();el('result-stars').innerHTML='';el('star-announcement').textContent='';
 currentGameMode='time';questState.replay={mode:'stars',source};currentVerseList=Core.shuffle(pool);
 playBGM('time');startGame(60);el('round-label').textContent=`✦ クックと ほしあつめ · ${starSources[source].name}`;
 renderStarRound();showMascotMessage('正しく打って、ぼくと星を あつめよう！',2800,'combo','bounce');
};
const starOriginalScreen=window.showScreen;
window.showScreen=function(id){
 starOriginalScreen(id);
 el('star-hud').hidden=id!=='screen-game'||!isStarChallenge();
 el('result-stars').hidden=id!=='screen-result'||!isStarChallenge();
 document.body.dataset.starRound=isStarChallenge()?(id==='screen-game'?'on':id==='screen-result'?'result':'off'):'off';
 if(id!=='screen-game')clearStarEffects();
};
const starOriginalAdvance=window.advanceTyping;
window.advanceTyping=function(){
 const collect=isStarChallenge()&&questState.playing&&!questState.paused&&!questState.transitioning;
 starOriginalAdvance();
 if(!collect)return;
 const previousBonus=starRound.bonus,reward=StarCollectCore.correct(starRound);renderStarRound();popCollectedStar(reward.earned);
 if(reward.leveled)celebrateStarRound('level');else if(starRound.bonus>previousBonus)celebrateStarRound('bonus');else if(typedCount>=currentRomaji.length)celebrateStarRound('word');
 if(reward.leveled){el('star-announcement').textContent=`あつめる力が レベル${starRound.level}に なったよ！`;showMascotMessage(`レベル${starRound.level}！ 1文字で 星が${starRound.level}こ！`,2200,'victory','bounce');}
};
const starOriginalProcess=window.processTypingKey;
window.processTypingKey=function(key){
 const collect=isStarChallenge()&&questState.playing&&!questState.paused&&!questState.transitioning;
 if(collect&&questState.startedAt!==null&&elapsedRound()>=60000){endGame();return;}
 const before=missCount;starOriginalProcess(key);
 if(collect&&missCount>before){StarCollectCore.miss(starRound);renderStarRound();el('star-announcement').textContent='星とレベルは そのまま。ゆっくり つづけよう！';}
};
const starOriginalEnd=window.endGame;
window.endGame=function(isWinner=false){
 const collect=isStarChallenge()&&questState.playing,complete=collect&&questState.startedAt!==null&&elapsedRound()>=60000;
 starOriginalEnd(isWinner);if(!collect)return;
 const source=questState.replay.source,record=starRecord(source),previous=record.best,newBest=complete&&starRound.score>previous;
 if(complete){record.best=Math.max(previous,starRound.score);record.last=starRound.score;record.plays++;record.total+=starRound.score;record.maxLevel=Math.max(record.maxLevel,starRound.level);saveData();}
 questState.lastResult.stars={...starRound,source,previous,newBest,complete};
 el('result-title').textContent='ほしあつめ、おつかれさま！';
 el('result-stars').innerHTML=`<p class="star-result-label">${starSources[source].name}で あつめた星</p><p class="star-result-score">✦ ${starRound.score.toLocaleString()}<span>こ</span></p><p>${newBest?'いちばんの きろくを こうしん！':'いちばんの きろく '+record.best.toLocaleString()+'こ'}</p><p class="star-result-detail">あつめる力 レベル${starRound.level} · いちばん つづいた数 ${questState.maxCombo}文字</p>`;
 el('result-stars').hidden=false;
 celebrateStarRound('finish');
 el('result-coach').append(` 星とレベルは、まちがえても へらないよ。`);
};
const starOriginalRetry=window.retryQuest;
window.retryQuest=function(){if(isStarChallenge())startStarCollect(questState.replay.source);else starOriginalRetry();};
document.addEventListener('keydown',event=>{
 if(event.key!==' '||event.repeat||event.defaultPrevented||!isStarChallenge()||!el('screen-result').classList.contains('active'))return;
 if(event.target?.closest?.('button,[role="button"],a,input,textarea'))return;
 event.preventDefault();retryQuest();
});
