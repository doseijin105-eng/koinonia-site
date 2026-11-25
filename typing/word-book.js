'use strict';
const wordBookState={kind:'verses',search:'',page:0,pageSize:12};
const escapeWord=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function wordRuby(value){let out='',offset=0;for(const match of value.matchAll(/<ruby>([^<]+)<rt>([^<]+)<\/rt><\/ruby>/g)){out+=escapeWord(value.slice(offset,match.index));out+=`<ruby>${escapeWord(match[1])}<rt>${escapeWord(match[2])}</rt></ruby>`;offset=match.index+match[0].length;}return out+escapeWord(value.slice(offset));}
function pickCookTalk(category='idle'){
 const pool=QuestContent.cookTalks.filter(t=>category==='idle'?['idle','scripture'].includes(t.category):t.category===category);
 return (pool[Math.floor(Math.random()*pool.length)]||QuestContent.cookTalks[0]).text;
}
window.pokeMascot=function(){
 const category=questState.paused?'rest':questState.playing?'combo':'idle';
 const text=pickCookTalk(category);
 showMascotMessage(text,Math.min(9500,Math.max(4000,text.length*85)),questState.paused?'rest':questState.playing?'combo':text.includes('『')?'pray':'default','bounce');
};
function openWordBook(){showScreen('screen-word-book');renderWordBook();}
function selectWordBook(kind){wordBookState.kind=kind;wordBookState.page=0;renderWordBook();}
function searchWordBook(text){wordBookState.search=text.trim();wordBookState.page=0;renderWordBook();}
function wordBookPool(kind){return kind==='cook'?QuestContent.cookTalks:kind==='quotes'?QuestContent.theologianQuotes:kind==='anime'?QuestContent.animeQuotes:versesData;}
function wordBookEntries(){
 const items=wordBookPool(wordBookState.kind);
 const query=wordBookState.search.normalize('NFKC').toLowerCase();
 return items.map((entry,index)=>({entry,index})).filter(({entry})=>[entry.jp,entry.ref,entry.work,entry.character,entry.text,entry.ruby?.replace(/<ruby>[^<]+<rt>([^<]+)<\/rt><\/ruby>/g,'$1').replace(/<[^>]*>/g,'')].filter(Boolean).join(' ').normalize('NFKC').toLowerCase().includes(query));
}
function renderWordBook(){
 const entries=wordBookEntries(),pages=Math.max(1,Math.ceil(entries.length/wordBookState.pageSize));wordBookState.page=Math.min(wordBookState.page,pages-1);
 const isCook=wordBookState.kind==='cook',isAnime=wordBookState.kind==='anime',isQuote=wordBookState.kind==='quotes'||isAnime;
 for(const kind of ['verses','quotes','anime','cook'])el('book-tab-'+kind).setAttribute('aria-pressed',String(kind===wordBookState.kind));
 el('book-count').textContent=wordBookState.search?`${entries.length}この ことばが 見つかったよ`:`${entries.length}${isCook?'しゅるいの クックのことば':isAnime?'もんの 漫画・アニメのことば':isQuote?'もんの 考える人のことば':'もんの せいしょのことば'}が あるよ`;
 const visible=entries.slice(wordBookState.page*wordBookState.pageSize,(wordBookState.page+1)*wordBookState.pageSize);
 el('book-list').innerHTML=visible.length?visible.map(({entry,index})=>isCook?`<article class="word-card cook-word"><span class="word-kicker">🐰 クックのことば</span><p class="cook-word-text">${escapeWord(entry.text)}</p><button class="btn" onclick="hearCookWord(${index})">クックに 話してもらう</button></article>`:`<article class="word-card ${isAnime?'anime-word':isQuote?'thinker-word':''}"><span class="word-kicker">${isAnime?'🎬':isQuote?'💡':'📖'} ${entry.attribution==='unverified'?'紹介名：':''}${escapeWord(entry.ref)}</span>${isQuote?`<span class="quote-kind">${escapeWord(entry.kind)}</span>`:''}<p class="book-verse">${wordRuby(entry.ruby)}</p>${isQuote?`<p class="quote-note">${escapeWord(entry.note)}</p><p class="quote-source">${escapeWord(entry.work)}${entry.location?'<br>'+escapeWord(entry.location):''}${/^https?:\/\//.test(entry.sourceUrl||'')?`<br><a href="${escapeWord(entry.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeWord(entry.sourceLabel||'もとの本（出典）↗')}</a>`:''}</p>`:''}<button class="btn" onclick="startWordPractice(${index},'${isAnime?'anime':isQuote?'quotes':'verses'}')">この1もんで れんしゅう</button></article>`).join(''):'<p class="book-empty">見つからなかったよ。べつのことばで さがしてみよう。</p>';
 el('book-previous').disabled=wordBookState.page===0;el('book-next').disabled=wordBookState.page>=pages-1;el('book-page').textContent=`${wordBookState.page+1} / ${pages} ページ`;
}
function moveWordBook(direction){wordBookState.page=Math.max(0,wordBookState.page+direction);renderWordBook();el('word-book-heading').scrollIntoView?.({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
function hearCookWord(index){const talk=QuestContent.cookTalks[index];if(!talk)return;showMascotMessage(talk.text,Math.min(9500,Math.max(4000,talk.text.length*85)),talk.category==='scripture'?'pray':talk.category==='rest'?'rest':talk.category==='combo'?'combo':'default','bounce');}
function startWordPractice(index,kind='verses'){if(!['verses','quotes','anime'].includes(kind))return;const entry=wordBookPool(kind)[index];if(!entry)return;currentGameMode='theme';selectedTheme='all';selectedDifficulty='normal';selectedTime=0;questState.replay={mode:'book',kind,index};currentVerseList=[entry];playBGM('map');startGame(0);el('round-label').textContent=kind==='anime'?'🎬 漫画・アニメの名言・1もんれんしゅう':kind==='quotes'?'💡 考える人のことば・1もんれんしゅう':'📜 ことばの本・1もんれんしゅう';}
const wordBookRetry=window.retryQuest;
window.retryQuest=function(){if(questState.replay?.mode==='book')startWordPractice(questState.replay.index,questState.replay.kind);else wordBookRetry();};
const wordBookScreen=window.showScreen;
window.showScreen=function(id){wordBookScreen(id);if(id==='screen-word-book'){currentGameMode='';playBGM('menu');}};
