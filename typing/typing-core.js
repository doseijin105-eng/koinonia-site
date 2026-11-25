(function (root) {
  'use strict';
  const alternatives = [['shi','si'],['chi','ti'],['tsu','tu'],['fu','hu'],['ji','zi'],['sha','sya'],['shu','syu'],['sho','syo'],['cha','tya'],['chu','tyu'],['cho','tyo']].flatMap(([a,b]) => [[a,b],[b,a]]);
  function acceptKey(text, index, key) {
    key = key.toLowerCase();
    if (text[index] === key) return { accepted: true, text };
    for (let offset = 0; offset <= 2; offset++) {
      const start = index - offset;
      if (start < 0) continue;
      const rest = text.slice(start), typed = text.slice(start, index);
      for (const [from, to] of alternatives) {
        if (rest.startsWith(from) && to.startsWith(typed + key)) {
          return { accepted: true, text: text.slice(0, start) + to + text.slice(start + from.length) };
        }
      }
    }
    if (key === 'n' && text[index - 1] === 'n' && text[index] !== 'n') {
      return { accepted: true, text: text.slice(0, index) + 'n' + text.slice(index) };
    }
    if (text[index] === 'n' && text[index - 1] === 'n' && text[index + 1] === key && !'aiueoyn'.includes(key)) {
      return { accepted: true, text: text.slice(0, index) + text.slice(index + 1) };
    }
    return { accepted: false, text };
  }
  function shuffle(list, random = Math.random) {
    const result = [...list];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function themePool(verses, theme, difficulty) {
    const pool = verses.filter(v => theme === 'all' || v.theme === theme);
    const sorted = [...pool].sort((a,b) => a.romaji.length - b.romaji.length);
    if (difficulty === 'easy') return sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2)));
    if (difficulty === 'hard') return sorted.slice(Math.floor(sorted.length / 2));
    return pool;
  }
  function repeatQuestions(pool, count, random = Math.random) {
    if (!pool.length) return [];
    const questions = [];
    while (questions.length < count) questions.push(...shuffle(pool, random));
    return questions.slice(0, count);
  }
  function metrics(chars, misses, milliseconds) {
    const seconds = Math.max(1, milliseconds / 1000);
    return { cpm: Math.round(chars * 60 / seconds), accuracy: chars + misses ? Math.round(chars * 1000 / (chars + misses)) / 10 : 100, seconds };
  }
  function starsFor(accuracy) { return accuracy >= 97 ? 3 : accuracy >= 85 ? 2 : 1; }
  function levelInfo(xp) {
    const level = Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
    const start = 100 * (level - 1) ** 2, next = 100 * level ** 2;
    return { level, into: xp - start, needed: next - start };
  }
  const api = { acceptKey, shuffle, themePool, repeatQuestions, metrics, starsFor, levelInfo };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TypingQuestCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
