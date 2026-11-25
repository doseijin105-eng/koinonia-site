/* 4.3 builds on the user's 4.1 data and multiplayer mode. */
'use strict';
const Core = TypingQuestCore;
const questState = {
  playing:false, paused:false, startedAt:null, pausedAt:0, pausedMs:0,
  transitioning:false, nextVerseTimer:null, maxCombo:0, solved:0,
  replay:null, lastResult:null, moodTimer:null, toastTimer:null, multiStartTimer:null
};
const el = id => document.getElementById(id);
const localDay = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
function freshAdventure() { return { xp:0, sessions:0, characters:0, best:{}, stars:{}, daily:{date:'',sessions:0,solved:0,combo:0,claimed:[]} }; }
function ensureDaily() {
  if (progress.adventure.daily.date !== localDay()) progress.adventure.daily = {date:localDay(),sessions:0,solved:0,combo:0,claimed:[]};
  return progress.adventure.daily;
}
window.loadData = function () {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem('typingQuestSaveV3') || localStorage.getItem('typingQuestSaveV2') || 'null'); } catch (_) {}
  progress = { mapCleared:0, bossCleared:0, stamps:{}, rankings:{30:[],60:[],90:[]}, adventure:freshAdventure() };
  if (saved && typeof saved === 'object') {
    progress.mapCleared = Math.min(mapStages.length, Math.max(0, Number(saved.mapCleared) || 0));
    progress.bossCleared = Math.min(bossStages.length, Math.max(0, Number(saved.bossCleared) || 0));
    if (saved.stamps && typeof saved.stamps === 'object') progress.stamps = saved.stamps;
    for (const seconds of [30,60,90]) if (Array.isArray(saved.rankings?.[seconds])) progress.rankings[seconds] = saved.rankings[seconds].filter(r => Number.isFinite(r.wpm)).slice(0,5);
    if (saved.adventure && typeof saved.adventure === 'object') {
      const a = saved.adventure;
      progress.adventure = {...freshAdventure(),...a,xp:Math.max(0,Number(a.xp)||0),best:a.best||{},stars:a.stars||{}};
      if (!a.daily || !Array.isArray(a.daily.claimed)) progress.adventure.daily = freshAdventure().daily;
    }
  }
  ensureDaily(); refreshJournal(); saveData();
};

function dailyMissions() {
  const d = ensureDaily();
  return [
    {id:'session',icon:'☀',title:'1回 あそんでみよう',value:d.sessions,target:1},
    {id:'verses',icon:'📖',title:'もんだいを3つ クリアしよう',value:d.solved,target:3},
    {id:'combo',icon:'✦',title:'20文字 つづけて打とう',value:d.combo,target:20}
  ];
}
function refreshJournal() {
  const level = Core.levelInfo(progress.adventure.xp);
  const names = ['はじめての たび','みことばの たんけんたい','きぼうの あんない人','ひかりを はこぶ人'];
  el('profile-level').textContent = `レベル ${level.level} ${names[Math.min(3,Math.floor((level.level-1)/3))]}`;
  el('profile-xp').textContent = `${level.into} / ${level.needed} ポイント`;
  el('profile-xp-bar').style.width = `${level.into / level.needed * 100}%`;
  el('profile-stamps').textContent = `スタンプ ${Object.values(progress.stamps).filter(Boolean).length}こ`;
  el('daily-date').textContent = localDay().slice(5).replace('-',' / ');
  el('daily-missions').innerHTML = dailyMissions().map(m => {
    const done = m.value >= m.target;
    return `<div class="mission ${done?'done':''}"><span class="mission-icon">${done?'✓':m.icon}</span><div><strong>${m.title}</strong><small>${Math.min(m.value,m.target)} / ${m.target} · ${done?'できた！':'できたら +20 ポイント'}</small></div></div>`;
  }).join('');
  el('continue-adventure').textContent = progress.mapCleared < mapStages.length ? `${mapStages[progress.mapCleared].name}へ しゅっぱつ →` : 'もういちど たびへ →';
}
function notifyQuest(message) {
  const toast = el('quest-toast'); if (!toast) return;
  toast.textContent = message; toast.classList.add('show');
  clearTimeout(questState.toastTimer);
  questState.toastTimer = setTimeout(() => toast.classList.remove('show'),2600);
}
function celebrateStars(big = false) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const host = el('sparkles');
  for(let i=0; i<(big?20:9); i++) {
    const star = document.createElement('span'); star.className='sparkle'; star.textContent='✦';
    star.style.left=`${38+Math.random()*24}%`; star.style.top=`${big?32:48}%`;
    star.style.setProperty('--dx',`${(Math.random()-.5)*400}px`); star.style.setProperty('--dy',`${-80-Math.random()*170}px`);
    star.style.animationDelay=`${i*18}ms`; host.appendChild(star); setTimeout(()=>star.remove(),1700);
  }
}

const originalShowScreen = window.showScreen;
window.showScreen = function (id) {
  if (questState.playing && id !== 'screen-game' && id !== 'screen-result') stopRound();
  originalShowScreen(id);
  if (id === 'screen-menu') refreshJournal();
  window.scrollTo({top:0,behavior:'instant'});
  syncInteractiveCards();
};
function syncInteractiveCards() {
  document.querySelectorAll('.menu-card,.map-node,.boss-grid .boss-card').forEach(card => {
    card.setAttribute('role','button');
    const locked=card.classList.contains('locked');
    card.tabIndex=locked?-1:0; card.setAttribute('aria-disabled',String(locked));
  });
}
document.addEventListener('keydown',event=>{
  if ((event.key==='Enter'||event.key===' ') && event.target.matches('[role="button"]') && event.target.getAttribute('aria-disabled')!=='true') {
    event.preventDefault(); event.target.click();
  }
});
window.changeMascotImage = function () { el('mascot-image').src='assets/cook-companion.webp'; };
window.handleMascotError = function (img) { img.style.display='none';el('mascot-emoji').style.display='block'; };
window.showMascotMessage = function (message, duration=2800, state='default', animType='') {
  const bubble=el('mascot-bubble'); bubble.textContent=message; bubble.classList.add('show');
  const companion=el('companion');
  companion.dataset.mood=state==='victory'?'victory':animType==='shake'?'care':animType==='bounce'||state==='combo'?'cheer':'idle';
  clearTimeout(bubbleTimeout); clearTimeout(questState.moodTimer);
  questState.moodTimer=setTimeout(()=>companion.dataset.mood='idle',1800);
  bubbleTimeout=setTimeout(()=>bubble.classList.remove('show'),duration);
};
window.pokeMascot = function () {
  const msgs=questState.playing ? ['ゆっくりで大丈夫。次の1文字に集中しよう！','肩の力を抜いて、一文字ずつ🐰'] : [...randomTalkMsgs,'今日の3問、いっしょに挑戦してみよう！','ぼくの星も、君といっしょに輝くよ✦'];
  showMascotMessage(msgs[Math.floor(Math.random()*msgs.length)],3000,'default','bounce');
};

window.playBGM = function (name) {
  const next=bgms[name]; if (!next) return;
  if (currentBgm !== next) { if(currentBgm) {currentBgm.pause();currentBgm.currentTime=0;} currentBgm=next; }
  if (isSoundOn && !questState.paused) currentBgm.play().catch(()=>{});
};
const originalPlaySE=window.playSE;
window.playSE=function (type) {if(globalVolume>0)originalPlaySE(type);};
window.toggleSound = function () {
  isSoundOn=!isSoundOn; el('sound-toggle').textContent=isSoundOn?'🔊':'🔇';
  if (!isSoundOn) {Object.values(bgms).forEach(b=>b.pause());return;}
  if (AudioContext && !audioCtx) audioCtx=new AudioContext();
  if (audioCtx?.state==='suspended') audioCtx.resume().catch(()=>{});
  if (currentBgm && !questState.paused) currentBgm.play().catch(()=>{});
};
window.initGameAndAudio = function (soundEnabled) {
  isSoundOn=soundEnabled;el('sound-toggle').textContent=isSoundOn?'🔊':'🔇';el('sound-controls').style.display='flex';
  if (isSoundOn && AudioContext) {audioCtx=new AudioContext();audioCtx.resume().catch(()=>{});}
  showScreen('screen-menu');showMascotMessage('クックと いっしょに あそぼう！',3000,'default','bounce');
};

const originalInitMap=window.initMap;
window.initMap=function () {
  originalInitMap();
  document.querySelectorAll('.map-node').forEach((node,i)=>{
    const stars=progress.adventure.stars[mapStages[i].id]||0;
    const label=document.createElement('span');label.className='stage-stars';label.textContent=stars?'★'.repeat(stars)+'☆'.repeat(3-stars):'☆☆☆';node.appendChild(label);
    node.setAttribute('aria-label',`${mapStages[i].name} ${stars}つ星${node.classList.contains('locked')?'・未解放':''}`);
  });syncInteractiveCards();
};
window.initBossSelect=function () {
  el('boss-grid').innerHTML=bossStages.map((boss,i)=>{
    const state=i<progress.bossCleared?'cleared':i===progress.bossCleared?'unlocked':'locked';
    return `<div class="boss-card ${state}" onclick="${state==='locked'?'':`startBossBattle(${i})`}">${boss.image?`<img class="boss-thumb" src="${boss.image}" alt="${boss.name}" loading="lazy">`:`<span class="boss-placeholder">${boss.icon}</span>`}<strong>${boss.name}</strong><span class="boss-state">${state==='cleared'?'✓ 撃破済み':state==='locked'?'🔒 前の試練をクリア':'挑戦できます'} · HP ${boss.maxHp}</span></div>`;
  }).join('');syncInteractiveCards();
};
themesList.push({id:'christmas',name:'🎄 クリスマス',desc:'クリスマスの御言葉',color:'#3a4235'},{id:'easter',name:'🌿 イースター',desc:'よみがえりの御言葉',color:'#394252'});
themesList.push({id:'thinkers',name:'💡 神学者・偉人のことば',desc:'考える人たちのことばで れんしゅう',color:'#fff4df'},{id:'anime',name:'🎬 漫画・アニメの名言',desc:'すきな作品のセリフで れんしゅう',color:'#edf5ff'});
themesList.unshift({id:'beginner',name:'🌱 しょきゅう · はじめての たんご',desc:'短いたんごで ゆっくり れんしゅう',color:'#edf8df'});
function selectedThemePool(){const source=selectedTheme==='beginner'?BeginnerWords:selectedTheme==='thinkers'?QuestContent.theologianQuotes:selectedTheme==='anime'?QuestContent.animeQuotes:versesData;return Core.themePool(source,selectedTheme,selectedDifficulty);}
const originalThemeSelect=window.initThemeSelect;
window.initThemeSelect=function(){originalThemeSelect();syncInteractiveCards();};
window.openThemeSettings=function (themeId,themeName) {
  selectedTheme=themeId;selectedDifficulty='normal';selectedTime=0;
  el('theme-settings-title').textContent=themeName;updateThemeSettingsUI();showScreen('screen-theme-settings');
};
window.selectThemeDifficulty=function (diff) {selectedDifficulty=diff;updateThemeSettingsUI();};
window.selectThemeTime=function (seconds) {selectedTime=seconds;updateThemeSettingsUI();};
function updateThemeSettingsUI() {
  for (const diff of ['easy','normal','hard']) el(`btn-diff-${diff}`).setAttribute('aria-pressed',String(diff===selectedDifficulty));
  for (const seconds of [0,30,60]) el(`btn-time-${seconds}`).setAttribute('aria-pressed',String(seconds===selectedTime));
  let note=el('theme-note');if(!note){note=document.createElement('p');note.id='theme-note';note.className='theme-note';el('theme-settings-title').after(note);}
  const pool=selectedThemePool();
  note.textContent=`${pool.length}しゅるいの ことばで あそべるよ。${selectedTime?'何もん 打てるかな？':'5もんでクリア。ゆっくりで だいじょうぶ。'}`;
}
window.startThemeGame=function () {
  const pool=selectedThemePool();
  if (!pool.length) {notifyQuest('このお話の もんだいはないよ。べつのお話をえらんでね。');return;}
  currentGameMode='theme';questState.replay={mode:'theme',theme:selectedTheme,diff:selectedDifficulty,time:selectedTime};
  currentVerseList=selectedTime?Core.shuffle(pool):Core.repeatQuestions(pool,5);
  playBGM(selectedTime?'time':'map');startGame(selectedTime);
};
window.continueAdventure=function () {startMapStage(Math.min(progress.mapCleared,mapStages.length-1));};
window.startDailyQuest=function () {
  currentGameMode='daily';const pool=versesData.filter(v=>v.romaji.length<=45);
  const seed=Number(localDay().replaceAll('-',''));const offset=seed%pool.length;
  currentVerseList=Array.from({length:3},(_,i)=>pool[(offset+i)%pool.length]);
  questState.replay={mode:'daily'};playBGM('map');startGame(0);
};
window.startMapStage=function (index) {
  if (!mapStages[index] || index>progress.mapCleared) return;
  currentGameMode='map';currentStageIndex=index;questState.replay={mode:'map',stage:index};
  const main=mapStages[index].verse;
  currentVerseList=[main,...Core.repeatQuestions(versesData.filter(v=>v.ref!==main.ref),2+index)];
  playBGM('map');startGame(0);
};
window.startBossBattle=function (index) {
  if (!bossStages[index] || index>progress.bossCleared) return;
  currentGameMode='boss';currentStageIndex=index;currentBoss=bossStages[index];bossHp=currentBoss.maxHp;
  questState.replay={mode:'boss',stage:index};currentVerseList=Core.shuffle(versesData);
  el('boss-ui-name').textContent=`${currentBoss.icon} ${currentBoss.name}`;
  el('boss-image-container').style.display=currentBoss.image?'block':'none';
  if(currentBoss.image) {el('boss-image-display').src=currentBoss.image;el('boss-image-display').alt=currentBoss.name;el('boss-image-display').style.display='block';}
  updateBossHpBar();playBGM('boss');startGame(currentBoss.time);
};
window.startTimeAttack=function (seconds) {
  currentGameMode='time';questState.replay={mode:'time',time:seconds};currentVerseList=Core.shuffle(versesData);
  playBGM('time');startGame(seconds);
};
function elapsedRound() {
  if(questState.startedAt===null) return 0;
  const now=questState.paused?questState.pausedAt:performance.now();
  return Math.max(0,now-questState.startedAt-questState.pausedMs);
}
function stopRound() {
  clearInterval(timer);timer=null;clearTimeout(questState.nextVerseTimer);questState.nextVerseTimer=null;
  document.removeEventListener('keydown',handleKeydown);
  questState.playing=false;questState.paused=false;questState.transitioning=false;el('pause-overlay').hidden=true;
}
function beginRoundClock() {
  if(questState.startedAt!==null)return;
  questState.startedAt=performance.now();el('focus-hint').textContent='ゆっくり、ひと文字ずつ。';
  if(totalTimeLimit>0) timer=setInterval(()=>{
    if(!questState.playing||questState.paused)return;
    timeLeft=Math.max(0,Math.ceil(totalTimeLimit-elapsedRound()/1000));el('time-display').textContent=timeLeft;
    if(timeLeft===0)endGame();
  },100);
}
window.startGame=function (timeLimit=0) {
  stopRound();showScreen('screen-game');
  questState.playing=true;questState.startedAt=null;questState.pausedMs=0;questState.maxCombo=0;questState.solved=0;
  typedCount=0;missCount=0;comboCount=0;totalKeyCount=0;currentVerseIndex=0;totalTimeLimit=timeLimit;timeLeft=timeLimit;
  el('boss-ui').style.display=currentGameMode==='boss'?'block':'none';el('multi-ui').style.display=currentGameMode==='multi'?'block':'none';
  el('progress-text').style.display=timeLimit===0?'block':'none';el('time-display').textContent=timeLimit||'∞';el('combo-count').textContent=0;
  el('pause-button').hidden=currentGameMode==='multi';el('pause-button').innerHTML='ひと休み <kbd>Esc</kbd>';
  const labels={map:'🗺️ '+mapStages[currentStageIndex]?.name,boss:'⚔️ ボスに ちょうせん',time:'⏱️ '+timeLimit+'びょう チャレンジ',daily:'✦ きょうの3もん',theme:'📚 お話で れんしゅう',multi:'🌐 先に50文字！ 友だちときょうそう'};
  el('round-label').textContent=currentGameMode==='theme'&&selectedTheme==='beginner'?'🌱 しょきゅう · はじめての たんご':currentGameMode==='theme'&&selectedTheme==='anime'?'🎬 漫画・アニメの名言れんしゅう':currentGameMode==='theme'&&selectedTheme==='thinkers'?'💡 神学者・偉人のことば':labels[currentGameMode];el('focus-hint').textContent='光っている英字を おすと はじまるよ';
  el('typing-input').value='';updateRhythm();setVerse();document.addEventListener('keydown',handleKeydown);
  document.activeElement?.blur();
  if(currentGameMode==='multi')beginRoundClock();
};
window.setVerse=function () {
  if(!questState.playing)return;
  questState.transitioning=false;
  if(currentVerseIndex>=currentVerseList.length) {
    if(['boss','time','multi'].includes(currentGameMode)||(currentGameMode==='theme'&&totalTimeLimit>0)) {currentVerseIndex=0;currentVerseList=Core.shuffle(currentVerseList);}
    else {endGame();return;}
  }
  if(totalTimeLimit===0)el('progress-text').textContent=currentGameMode==='multi'?`${multiMyProgress} / ${multiGoal} 文字`:`${currentVerseIndex+1} / ${currentVerseList.length} もんめ`;
  const verse=currentVerseList[currentVerseIndex];currentRomaji=verse.romaji;typedCount=0;
  el('verse-ref').textContent=verse.theme==='beginner'?'🌱 はじめての たんご':verse.theme==='thinkers'?`💡 ${verse.ref} · ${verse.kind}`:verse.theme==='anime'?`🎬 ${verse.ref}`:`📖 ${verse.ref}`;
  const tokens=verse.ruby.match(/<ruby>.*?<\/ruby>|./g)||[];window.currentJpTokens=tokens;
  el('verse-jp').innerHTML=tokens.map((t,i)=>`<span id="jp-token-${i}" style="color:#fff;transition:color .15s">${t}</span>`).join('');
  updateRomajiDisplay();
};
const originalUpdateRomaji=window.updateRomajiDisplay;
window.updateRomajiDisplay=function () {
  originalUpdateRomaji();el('word-progress').style.width=`${Math.min(100,typedCount/currentRomaji.length*100)}%`;
  el('next-key').textContent=(currentRomaji[typedCount]||'✓').toUpperCase();
};
function updateRhythm() {
  el('live-accuracy').textContent=`${Core.metrics(totalKeyCount,missCount,1000).accuracy}%`;
  el('live-max-combo').textContent=questState.maxCombo;
  el('combo-meter').style.width=`${comboCount?((comboCount-1)%20+1)*5:0}%`;
  el('combo-hint').textContent=comboCount>=20?`${comboCount}文字つづいた！ いいちょうし ✦`:'20文字つづくと クックがおうえん！';
}
window.advanceTyping=function () {
  playSE('type');typedCount++;totalKeyCount++;comboCount++;questState.maxCombo=Math.max(questState.maxCombo,comboCount);
  el('combo-count').textContent=comboCount;updateRhythm();
  let damage=1;
  if(comboCount%20===0) {
    damage+=5;celebrateStars();notifyQuest(`${comboCount}文字つづいた ✦${currentGameMode==='boss'?' おまけ +5ポイント！':''}`);
    showMascotMessage(pickCookTalk('combo'),2600,'combo','bounce');
  }
  updateRomajiDisplay();
  if(typedCount>=currentRomaji.length)questState.solved++;
  if(currentGameMode==='boss') {bossHp=Math.max(0,bossHp-damage);updateBossHpBar();if(bossHp===0){endGame();return;}}
  if(currentGameMode==='multi'&&multiConn) {
    multiMyProgress++;sendMultiProgress();el('progress-text').textContent=`${multiMyProgress} / ${multiGoal} 文字`;
    if(multiMyProgress>=multiGoal){endGame(true);return;}
  }
  if(typedCount>=currentRomaji.length) {
    questState.transitioning=true;currentVerseIndex++;playSE('clear');
    questState.nextVerseTimer=setTimeout(setVerse,300);
  }
};
function processTypingKey(key) {
  if(!questState.playing||questState.paused||questState.transitioning||key.length!==1)return;
  beginRoundClock();
  const result=Core.acceptKey(currentRomaji,typedCount,key);
  if(result.accepted) {currentRomaji=result.text;advanceTyping();}
  else {
    playSE('miss');missCount++;comboCount=0;el('combo-count').textContent=0;updateRhythm();
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)el('verse-romaji').animate([{transform:'translateX(0)'},{transform:'translateX(4px)'},{transform:'translateX(-3px)'},{transform:'translateX(0)'}],{duration:160});
    if(missCount===3)showMascotMessage('だいじょうぶ。光っているキーを ゆっくりおそう！',2000,'rest','shake');
  }
}
window.handleKeydown=function (event) {
  if(event.key==='Escape') {event.preventDefault();if(currentGameMode!=='multi')togglePause();return;}
  if(event.ctrlKey||event.metaKey||event.altKey||event.isComposing||event.key.length!==1||event.target===el('typing-input'))return;
  if(!questState.playing||questState.paused||questState.transitioning)return;
  if(event.target?.closest?.('button,[role="button"],input,textarea'))return;
  event.preventDefault();processTypingKey(event.key);
};
el('typing-input').addEventListener('input',event=>{
  if(event.isComposing)return;
  for(const key of event.target.value)processTypingKey(key);
  event.target.value='';
});
el('typing-input').addEventListener('compositionend',event=>{
  event.target.value='';notifyQuest('英字（a・b・c）にして 打ってね');
});
window.togglePause=function () {
  if(!questState.playing||currentGameMode==='multi')return;
  questState.paused=!questState.paused;el('pause-overlay').hidden=!questState.paused;
  if(questState.paused) {
    questState.pausedAt=performance.now();if(currentBgm)currentBgm.pause();
    clearTimeout(questState.nextVerseTimer);
    showMascotMessage('ひと休みしよう。時計も とまっているよ。',2200,'rest');
    el('pause-overlay').querySelector('button').focus();
  } else {
    if(questState.startedAt!==null)questState.pausedMs+=performance.now()-questState.pausedAt;
    if(questState.transitioning)questState.nextVerseTimer=setTimeout(setVerse,250);
    if(isSoundOn&&currentBgm)currentBgm.play().catch(()=>{});
    if(window.matchMedia('(max-width:760px)').matches)el('typing-input').focus();else document.activeElement?.blur();
  }
};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&questState.playing&&!questState.paused&&currentGameMode!=='multi')togglePause();});
window.quitGame=function () {
  const multi=currentGameMode==='multi';stopRound();if(multi)disconnectPeer();showScreen('screen-menu');
  showMascotMessage('おつかれさま！ またいっしょに あそぼう！',2500,'rest');
};

function rewardRound(metrics,won) {
  const a=progress.adventure, day=ensureDaily();
  if(totalKeyCount<15)return {xp:0,bonus:0,levelUp:false};
  const before=Core.levelInfo(a.xp).level;
  const xp=10+questState.solved*8+Math.floor(totalKeyCount/12)+(metrics.accuracy>=95?10:0)+(won?5:0);
  a.xp+=xp;a.sessions++;a.characters+=totalKeyCount;day.sessions++;day.solved+=questState.solved;day.combo=Math.max(day.combo,questState.maxCombo);
  let bonus=0;
  for(const m of dailyMissions())if(m.value>=m.target&&!day.claimed.includes(m.id)){day.claimed.push(m.id);bonus+=20;}
  a.xp+=bonus;return {xp,bonus,levelUp:Core.levelInfo(a.xp).level>before};
}
window.endGame=function (isMultiWinner=false) {
  if(!questState.playing)return;
  const elapsed=elapsedRound(), mode=currentGameMode;
  const metrics=Core.metrics(totalKeyCount,missCount,elapsed);
  const won=mode==='boss'?bossHp<=0:mode==='multi'?isMultiWinner:mode==='map'||mode==='daily'?currentVerseIndex>=currentVerseList.length:true;
  stopRound();
  const info=getTitleInfo(metrics.cpm);currentWpmForShare=metrics.cpm;currentTitleForShare=info.title;
  el('result-stamp').textContent='';el('result-boss').textContent='';
  let newStamp=false;
  if(mode==='map'&&won) {
    const stage=mapStages[currentStageIndex];progress.mapCleared=Math.max(progress.mapCleared,currentStageIndex+1);
    progress.adventure.stars[stage.id]=Math.max(progress.adventure.stars[stage.id]||0,Core.starsFor(metrics.accuracy));newStamp=awardStamp(stage.id);
    el('result-boss').textContent=`${stage.name} ${'★'.repeat(Core.starsFor(metrics.accuracy))}${'☆'.repeat(3-Core.starsFor(metrics.accuracy))}`;
  } else if(mode==='boss') {
    if(won) {progress.bossCleared=Math.max(progress.bossCleared,currentStageIndex+1);newStamp=awardStamp(currentBoss.id);}
    else el('result-boss').textContent=`あと ${bossHp} ポイント！ 20文字つづけて おまけをめざそう。`;
  } else if(mode==='multi') {
    if(won&&multiConn?.open) {
      multiConn.send({type:'lose'});
      const finishedConnection=multiConn,finishedPeer=peer;
      multiConn=null;peer=null;
      setTimeout(()=>{finishedConnection.close();finishedPeer?.destroy();},700);
    } else disconnectPeer();
  }
  const reward=rewardRound(metrics,won);
  const recordKey=questState.replay?.mode==='stars'?`stars:${questState.replay.source}:cpm`:questState.replay?.mode==='book'?`book:${questState.replay.kind||'verses'}:${questState.replay.index}`:mode==='theme'?`theme:${selectedTheme}:${selectedDifficulty}:${totalTimeLimit}`:mode==='map'||mode==='boss'?`${mode}:${currentStageIndex}`:mode==='daily'?`daily:${localDay()}`:`${mode}:${totalTimeLimit}`;
  const previous=progress.adventure.best[recordKey]||0;
  const eligible=totalKeyCount>=15&&(won||mode==='time'||mode==='theme');
  const newBest=eligible&&metrics.cpm>previous;
  if(newBest)progress.adventure.best[recordKey]=metrics.cpm;
  if(mode==='time'&&eligible&&questState.replay?.mode!=='stars')saveRanking(totalTimeLimit,metrics.cpm);
  saveData();
  questState.lastResult={mode,stage:currentStageIndex,won,metrics,reward};
  const winTitles={map:'たびのステージ、クリア！',daily:'きょうの3もん、クリア！',boss:'ボスを クリア！',multi:'きょうそう、クリア！',time:'チャレンジ、おつかれさま！',theme:'れんしゅう、おつかれさま！'};
  el('result-title').textContent=won?winTitles[mode]:'よく がんばったね！';el('result-title').style.color=won?'var(--gold)':'#c6d8db';
  el('result-wpm').textContent=`${metrics.cpm} 文字 / 1分${newBest?' · いちばんの きろく！':''}`;
  el('result-rank').textContent=`ランク ${info.rank}`;el('result-shogo').textContent=info.title;
  el('result-stamp').textContent=newStamp?'✦ あたらしい スタンプをゲット！':reward.levelUp?'✦ レベルアップ！':'';
  el('result-details').innerHTML=`<div class="result-stat"><span>正しく 打てた文字</span><strong>${metrics.accuracy}%</strong></div><div class="result-stat"><span>いちばん つづいた数</span><strong>${questState.maxCombo}</strong></div><div class="result-stat"><span>がんばりポイント${reward.bonus?'（おまけ入り）':''}</span><strong>+${reward.xp+reward.bonus} ポイント</strong></div>`;
  const coach=totalKeyCount===0?'つぎは光っている文字を いっしょに打ってみよう。':missCount===0?'まちがいなし！ ていねいに打てたね。':metrics.accuracy>=95?'正しく 打てた文字がすばらしいね。次は星3つを目指そう！':'光っている文字を、ひとつずつ。クックと ゆっくり れんしゅうしよう。';
  el('result-coach').textContent=`${coach} ${questState.solved}もん · ${totalKeyCount}文字 · ${Math.round(metrics.seconds)}びょう${previous?` · これまでのベスト ${previous}文字/分`:''}`;
  const hasNext=won&&((mode==='map'&&currentStageIndex+1<mapStages.length)||(mode==='boss'&&currentStageIndex+1<bossStages.length));
  el('next-adventure').hidden=!hasNext;
  showScreen('screen-result');playBGM('result');if(won){playSE('clear');celebrateStars(true);}
  showMascotMessage(won?'やったね！ きみのがんばりで ぼくの星もキラキラ✦':'またいっしょに あそぼう。少しずつで だいじょうぶ！',3500,won?'victory':'rest',won?'bounce':'');
  if(reward.bonus)notifyQuest(`きょうの めあてができた！ +${reward.bonus} ポイント`);
};
window.retryQuest=function () {
  const r=questState.replay;if(!r){showScreen('screen-multi-lobby');return;}
  if(r.mode==='map')startMapStage(r.stage);else if(r.mode==='boss')startBossBattle(r.stage);else if(r.mode==='time')startTimeAttack(r.time);else if(r.mode==='daily')startDailyQuest();
  else if(r.mode==='theme'){selectedTheme=r.theme;selectedDifficulty=r.diff;selectedTime=r.time;startThemeGame();}
};
window.startNextAdventure=function () {
  const r=questState.lastResult;if(!r?.won)return;
  if(r.mode==='map')startMapStage(r.stage+1);else if(r.mode==='boss')startBossBattle(r.stage+1);
};

// Keep the P2P feature, while giving failed connections a visible recovery path.
const originalCreateRoom=window.createRoom,originalJoinRoom=window.joinRoom,originalStartMulti=window.startMultiGame;
function watchPeer() {
  if(!peer)return;
  peer.on('error',()=>{
    el('host-status').textContent='つながらなかったよ。へやを つくりなおしてね。';
    el('guest-status').textContent='へやの数字を たしかめて、もういちど やってみよう。';
  });
}
window.createRoom=function () {
  if(typeof Peer==='undefined'){el('host-status').textContent='つながらなかったよ。ページをひらきなおしてね。';return;}
  originalCreateRoom();watchPeer();
};
window.joinRoom=function () {
  if(!/^\d{4}$/.test(el('join-room-id').value.trim())){el('guest-status').textContent='4つの数字を 入れてね。';return;}
  if(typeof Peer==='undefined'){el('guest-status').textContent='つながらなかったよ。ページをひらきなおしてね。';return;}
  originalJoinRoom();watchPeer();
};
window.startMultiGame=function (verses) {questState.replay=null;originalStartMulti(verses);};
window.setupMultiConnection=function (isHost) {
  const connection=multiConn;
  el(isHost?'host-status':'guest-status').textContent='つながった！ もうすぐ はじまるよ。';
  connection.on('data',data=>{
    if(!data||typeof data!=='object')return;
    if(data.type==='start'&&!isHost) {
      const pool=Array.isArray(data.verses)?data.verses.map(v=>versesData.find(known=>known.ref===v?.ref&&known.romaji===v?.romaji)).filter(Boolean):[];
      if(pool.length)startMultiGame(pool);
    } else if(questState.playing&&currentGameMode==='multi') {
      if(data.type==='progress'&&Number.isFinite(data.count)){multiOpponentProgress=Math.max(0,Math.min(multiGoal,data.count));updateMultiBar();}
      else if(data.type==='lose')endGame(false);
    }
  });
  connection.on('close',()=>{
    if(multiConn!==connection)return;
    if(questState.playing&&currentGameMode==='multi'){endGame(false);notifyQuest('友だちとの きょうそうが おわったよ。');}
    else {clearTimeout(questState.multiStartTimer);el('host-status').textContent='つながりが きれたよ。へやを つくりなおしてね。';el('guest-status').textContent='つながりが きれたよ。もういちど へやに入ってね。';}
  });
  if(isHost)questState.multiStartTimer=setTimeout(()=>{
    if(multiConn!==connection||!connection.open)return;
    const pool=Core.shuffle(versesData);
    connection.send({type:'start',verses:pool});startMultiGame(pool);
  },2000);
};
window.disconnectPeer=function () {clearTimeout(questState.multiStartTimer);const connection=multiConn,oldPeer=peer;multiConn=null;peer=null;connection?.close();oldPeer?.destroy();};
// Complete passports for all existing destinations, without altering their verses.
for(const stage of mapStages)if(!stampsData.some(s=>s.id===stage.id))stampsData.push({id:stage.id,title:stage.name});
for(const boss of bossStages)if(!stampsData.some(s=>s.id===boss.id))stampsData.push({id:boss.id,title:boss.name});
el('join-room-id').setAttribute('aria-label','へやの4つの数字');el('join-room-id').inputMode='numeric';
syncInteractiveCards();
// Prepare saves before the start buttons can be used; audio need not block readiness.
Object.values(bgms).forEach(audio=>{audio.preload='none';});
window.onload=null;
loadData();
