(function(root){
 'use strict';
 function create(){return {score:0,level:1,xp:0,streak:0,bonus:1};}
 function needed(level){return level>=12?0:20+15*(level-1);}
 function correct(round){
  const earned=round.level,previous=round.level;
  round.score+=earned;round.streak++;round.bonus=Math.min(4,1+Math.floor(round.streak/20));
  if(round.level<12){round.xp+=round.bonus;while(round.level<12&&round.xp>=needed(round.level)){round.xp-=needed(round.level);round.level++;}}
  if(round.level===12)round.xp=0;
  return {earned,leveled:round.level>previous};
 }
 function miss(round){round.streak=0;round.bonus=1;}
 const api={create,needed,correct,miss};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.StarCollectCore=api;
})(typeof window!=='undefined'?window:globalThis);
