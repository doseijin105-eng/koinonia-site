/* The existing game rules and save keys remain the source of truth. */
'use strict';
const suppliedCookPoses={default:'assets/cook_default.webp',pray:'assets/cook_pray.webp',rest:'assets/cook_rest.webp',combo:'assets/cook_combo.webp',victory:'assets/cook_victory.webp'};
let childPoseTimer=null;
function baselineCookPose(){return el('screen-result').classList.contains('active')?(questState.lastResult?.won?'victory':'rest'):questState.paused?'rest':'default';}
window.changeMascotImage=function(state='default'){
 const pose=suppliedCookPoses[state]?state:'default',img=el('mascot-image');
 if(img.getAttribute('src')!==suppliedCookPoses[pose]){
   img.src=suppliedCookPoses[pose];img.dataset.pose=pose;
   if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)img.animate([{opacity:.55},{opacity:1}],{duration:260,easing:'ease-out'});
 }
 img.style.display='block';el('mascot-emoji').style.display='none';
};
const childOriginalMessage=window.showMascotMessage;
window.showMascotMessage=function(message,duration=3000,state='default',animation=''){
 childOriginalMessage(message,duration,state,animation);changeMascotImage(state);
 clearTimeout(childPoseTimer);childPoseTimer=setTimeout(()=>changeMascotImage(baselineCookPose()),duration);
};
window.pokeMascot=function(){
 const messages=questState.playing?['つぎの文字を、ゆっくり おそう！','まちがえても だいじょうぶ。いっしょに つづけよう！']:['きょうは どのお話で あそぶ？','いっしょに おいのりのことばを れんしゅうしよう。','ひとつずつ。できた！を ふやそう。'];
 showMascotMessage(messages[Math.floor(Math.random()*messages.length)],3300,questState.paused?'rest':questState.playing?'combo':'pray','bounce');
};
const childOriginalScreen=window.showScreen;
window.showScreen=function(id){
 childOriginalScreen(id);clearTimeout(childPoseTimer);
 changeMascotImage(id==='screen-result'?baselineCookPose():id==='screen-how-to-play'?'pray':'default');
};
const childOriginalPause=window.togglePause;
window.togglePause=function(){childOriginalPause();changeMascotImage(questState.paused?'rest':'default');};
const childOriginalRomaji=window.updateRomajiDisplay;
window.updateRomajiDisplay=function(){
 childOriginalRomaji();
 const count=Math.floor(typedCount/currentRomaji.length*(window.currentJpTokens?.length||0));
 for(let i=0;i<(window.currentJpTokens?.length||0);i++){
   const token=el(`jp-token-${i}`);if(token){token.style.color=i<count?'#347552':'#3f4544';token.style.textShadow='none';}
 }
 const tip=el('key-tip');if(tip)tip.textContent=currentRomaji[typedCount]==='.'?'「.」のキーを おしてね':currentRomaji[typedCount]===','?'「,」のキーを おしてね':'光っている英字を おしてね';
};
const childOriginalStart=window.startGame;
window.startGame=function(timeLimit=0){
 childOriginalStart(timeLimit);el('time-unit').hidden=timeLimit===0;
 if(timeLimit===0)el('time-display').textContent='時間なし';
};
const childOriginalBossBar=window.updateBossHpBar;
window.updateBossHpBar=function(){childOriginalBossBar();el('boss-hp-text').textContent=`のこり ${bossHp} / ${currentBoss.maxHp} ポイント`;};

const childBossStories=[
 {name:'エジプトの おって',image:'assets/boss-egypt-v43.webp',ref:'出エジプト記 14章',story:'馬がひく戦車にのって、エジプトの人たちが おってきます。',url:'https://www.biblegateway.com/passage/?search=Exodus+14%3A6-9&version=NIV'},
 {name:'大きな ゴリアテ',image:'assets/boss_goliath.webp',ref:'サムエル記上 17章',story:'大きなゴリアテに、ダビデは 神さまをしんじて たちむかいました。',url:'https://www.biblegateway.com/passage/?search=1+Samuel+17%3A5-7&version=NIV'},
 {name:'ライオンの あな',image:'assets/boss_lion.webp',ref:'ダニエル書 6章',story:'ダニエルは 神さまに守られ、ライオンに きずつけられませんでした。',url:'https://www.biblegateway.com/passage/?search=Daniel+6%3A22&version=NKJV'},
 {name:'大きな 赤いりゅう',image:'assets/boss_dragon.webp',ref:'ヨハネの黙示録 12章',story:'7つの頭をもつ、大きな赤いりゅうが 出てくるお話です。',url:'https://www.biblegateway.com/passage/?search=Revelation+12%3A3&version=NIV'}
];
bossStages.forEach((boss,i)=>Object.assign(boss,childBossStories[i]));
window.initBossSelect=function(){
 el('boss-grid').innerHTML=bossStages.map((boss,i)=>{
   const state=i<progress.bossCleared?'cleared':i===progress.bossCleared?'unlocked':'locked';
   const label=state==='cleared'?'✓ クリアしたよ':state==='locked'?'🔒 まえのボスを クリアしよう':'あそべるよ！';
   return `<div class="boss-card ${state}" onclick="${state==='locked'?'':`startBossBattle(${i})`}"><img class="boss-thumb" src="${boss.image}" alt="${boss.name}" loading="lazy"><strong>${boss.name}</strong><span class="boss-state">${label}<br>${boss.time}びょうで チャレンジ</span><p class="boss-story">${boss.story}</p><span class="boss-reference">せいしょのお話：${boss.ref}</span></div>`;
 }).join('');syncInteractiveCards();
};
const childThemes={encourage:{name:'🛡️ ゆうきのお話',color:'#edf8e3'},love:{name:'💖 あいと おいのり',color:'#fff0f2'},all:{name:'📖 せいしょの ぜんぶのお話',color:'#f1f4fd'},christmas:{name:'🎄 クリスマス',color:'#e8f7f0'},easter:{name:'🌿 よみがえりのお話',color:'#fff7d8'}};
themesList.forEach(theme=>Object.assign(theme,childThemes[theme.id]||{}));
window.getTitleInfo=function(speed){
 if(speed>=250)return {rank:'SSS',title:'👼 みことばの たつじん'};
 if(speed>=210)return {rank:'S',title:'✨ ぼうけんの めいじん'};
 if(speed>=180)return {rank:'A',title:'📜 ことばの あんない人'};
 if(speed>=120)return {rank:'C',title:'⚔ いさましい たび人'};
 if(speed>=60)return {rank:'E',title:'🐟 みことばの たんけんたい'};
 return {rank:'H',title:'🐑 たびの はじめの一歩'};
};

const passportSeals=[
 {id:'stage1',title:'エルサレム',asset:'seal-jerusalem',motif:'オリーブの しるし',description:'たびの はじめの町。木のえだを しるしにしたよ。',kind:'map',index:0},
 {id:'stage2',title:'ダマスコ',asset:'seal-damascus',motif:'あかりの しるし',description:'暗いところを てらす、むかしのあかりの形だよ。',kind:'map',index:1},
 {id:'stage3',title:'アンテオケ',asset:'seal-antioch',motif:'ふねの しるし',description:'つぎのたびへ。海をわたる ふねの形だよ。',kind:'map',index:2},
 {id:'stage4',title:'エペソ',asset:'seal-ephesus',motif:'まきものの しるし',description:'むかしの人が ことばを書いた、まきものの形だよ。',kind:'map',index:3},
 {id:'stage5',title:'ローマ',asset:'seal-rome',motif:'門の しるし',description:'たびのゴール。町へつづく 大きな門の形だよ。',kind:'map',index:4},
 {id:'boss1',title:'エジプト',asset:'seal-egypt',motif:'戦車の しるし',description:'エジプトのおってを クリアすると あつまるよ。',kind:'boss',index:0},
 {id:'boss3',title:'ゴリアテ',asset:'seal-goliath',motif:'ゆうきの しるし',description:'ゴリアテを クリアすると あつまるよ。',kind:'boss',index:1},
 {id:'boss5',title:'ライオン',asset:'seal-lion',motif:'ライオンの しるし',description:'ライオンのあなを クリアすると あつまるよ。',kind:'boss',index:2},
 {id:'boss7',title:'赤いりゅう',asset:'seal-dragon',motif:'りゅうの しるし',description:'赤いりゅうを クリアすると あつまるよ。',kind:'boss',index:3}
];
window.initCollection=function(){
 const earned=passportSeals.filter(seal=>progress.stamps[seal.id]).length;
 el('passport-count').textContent=`あつめたスタンプ ${earned} / ${passportSeals.length}こ`;
 el('stamp-grid').innerHTML=passportSeals.map(seal=>{
   const collected=!!progress.stamps[seal.id];
   return `<button type="button" class="stamp-slot ${collected?'collected':''}" onclick="showSealStory('${seal.id}')" aria-label="${seal.title}のスタンプ・${collected?'あつめたよ':'まだこれから'}"><img src="assets/${seal.asset}.webp" alt="${seal.motif}" loading="lazy"><span class="seal-name">${seal.title}</span><span class="seal-state">${collected?'✓ あつめたよ！':'まだ これから'}</span></button>`;
 }).join('');
 el('seal-detail').innerHTML='<p>スタンプを タップすると、お話が見られるよ。</p>';showRanking(30);
};
window.showSealStory=function(id){
 const seal=passportSeals.find(item=>item.id===id);if(!seal)return;
 const open=seal.index<=(seal.kind==='map'?progress.mapCleared:progress.bossCleared);
 el('seal-detail').innerHTML=`<img src="assets/${seal.asset}.webp" alt="${seal.motif}"><div><h4>${seal.title}：${seal.motif}</h4><p>${seal.description}</p><p>${progress.stamps[id]?'このスタンプは あつめたよ！':'まだこれから。じぶんのペースで すすもう！'}</p><button class="btn-action" ${open?`onclick="${seal.kind==='map'?'startMapStage':'startBossBattle'}(${seal.index})"`:'disabled'}>${open?'ここで あそぶ →':'まえのステージから すすもう'}</button></div>`;
 el('seal-detail').scrollIntoView?.({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
};
const childOriginalRanking=window.showRanking;
window.showRanking=function(seconds){
 childOriginalRanking(seconds);el('ranking-title').textContent=`${seconds}びょうの きろく`+((typeof rankScope!=='undefined'&&typeof netOn!=='undefined'&&netOn)?(rankScope==='all'?'(みんな)':'(じぶん)'):'');
 if(!progress.rankings[seconds]?.length)el('ranking-body').innerHTML='<tr><td colspan="4">まだきろくがないよ。時間チャレンジを やってみよう！</td></tr>';
};
window.continueAdventure=function(){startMapStage(progress.mapCleared>=mapStages.length?0:progress.mapCleared);};
changeMascotImage('default');refreshJournal();
