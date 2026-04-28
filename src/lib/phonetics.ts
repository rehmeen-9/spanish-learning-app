// Lightweight Spanish → English-style phonetic guide generator.
// Approximation only — not IPA. Designed for English speakers.
// Examples: gato → GAH-toh, gracias → GRAH-syahs, jirafa → hee-RAH-fah

const VOWELS = new Set(["a", "e", "i", "o", "u", "á", "é", "í", "ó", "ú"]);

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Map a Spanish word to a phonetic syllable string.
function phoneticForWord(word: string): string {
  const lower = word.toLowerCase();
  let i = 0;
  let out = "";
  while (i < lower.length) {
    const c = lower[i];
    const next = lower[i + 1] ?? "";

    // digraphs / context-sensitive
    if (c === "c" && (next === "e" || next === "i" || next === "é" || next === "í")) {
      out += "s";
      i += 1;
      continue;
    }
    if (c === "c" && next === "h") {
      out += "ch";
      i += 2;
      continue;
    }
    if (c === "c") {
      out += "k";
      i += 1;
      continue;
    }
    if (c === "q" && next === "u") {
      out += "k";
      i += 2;
      continue;
    }
    if (c === "g" && (next === "e" || next === "i" || next === "é" || next === "í")) {
      out += "h";
      i += 1;
      continue;
    }
    if (c === "g" && next === "u" && (lower[i + 2] === "e" || lower[i + 2] === "i")) {
      out += "g";
      i += 2;
      continue;
    }
    if (c === "g") {
      out += "g";
      i += 1;
      continue;
    }
    if (c === "j") {
      out += "h";
      i += 1;
      continue;
    }
    if (c === "h") {
      // silent
      i += 1;
      continue;
    }
    if (c === "ñ") {
      out += "ny";
      i += 1;
      continue;
    }
    if (c === "ll") {
      out += "y";
      i += 1;
      continue;
    }
    if (c === "l" && next === "l") {
      out += "y";
      i += 2;
      continue;
    }
    if (c === "r" && next === "r") {
      out += "rr";
      i += 2;
      continue;
    }
    if (c === "r" && i === 0) {
      out += "rr";
      i += 1;
      continue;
    }
    if (c === "v") {
      out += "b";
      i += 1;
      continue;
    }
    if (c === "z") {
      out += "s";
      i += 1;
      continue;
    }
    if (c === "y" && !VOWELS.has(next) && next !== "") {
      out += "ee";
      i += 1;
      continue;
    }
    if (c === "y") {
      out += "y";
      i += 1;
      continue;
    }
    if (c === "x") {
      out += "ks";
      i += 1;
      continue;
    }
    // Vowels
    if (c === "a" || c === "á") { out += "ah"; i += 1; continue; }
    if (c === "e" || c === "é") { out += "eh"; i += 1; continue; }
    if (c === "i" || c === "í") { out += "ee"; i += 1; continue; }
    if (c === "o" || c === "ó") { out += "oh"; i += 1; continue; }
    if (c === "u" || c === "ú") { out += "oo"; i += 1; continue; }
    if (c === "ü") { out += "oo"; i += 1; continue; }

    // default passthrough (b, d, f, k, m, n, p, s, t, w)
    out += c;
    i += 1;
  }
  return out;
}

// Split into syllables by inserting hyphens after vowel groups followed by consonant+vowel
function syllabify(phon: string): string[] {
  const tokens: string[] = [];
  // We'll treat 'ah','eh','ee','oh','oo' as single vowel sounds.
  const vowelSounds = ["ah", "eh", "ee", "oh", "oo"];
  let i = 0;
  let current = "";
  const isVowelStart = (s: string, idx: number) =>
    vowelSounds.some((v) => s.startsWith(v, idx));
  const vowelLen = (s: string, idx: number) => {
    for (const v of vowelSounds) if (s.startsWith(v, idx)) return v.length;
    return 0;
  };

  while (i < phon.length) {
    if (isVowelStart(phon, i)) {
      const vl = vowelLen(phon, i);
      current += phon.slice(i, i + vl);
      i += vl;
      // After a vowel, peek ahead: if next is consonant(s) followed by another vowel, cut after one consonant
      if (i < phon.length && !isVowelStart(phon, i)) {
        // collect consonants
        let cons = "";
        while (i < phon.length && !isVowelStart(phon, i)) {
          cons += phon[i];
          i += 1;
        }
        if (i >= phon.length) {
          // trailing consonants stay with current
          current += cons;
        } else {
          // split: leave last consonant with next syllable (CV preference)
          if (cons.length === 1) {
            tokens.push(current);
            current = cons;
          } else {
            current += cons.slice(0, cons.length - 1);
            tokens.push(current);
            current = cons.slice(-1);
          }
        }
      } else if (i >= phon.length) {
        tokens.push(current);
        current = "";
      } else {
        // Two vowels in a row → split
        tokens.push(current);
        current = "";
      }
    } else {
      current += phon[i];
      i += 1;
    }
  }
  if (current) tokens.push(current);
  return tokens.filter(Boolean);
}

// Spanish stress rules (simplified):
// - If the word has an accented vowel, that syllable is stressed.
// - Else if word ends in vowel, n, or s → second-to-last syllable.
// - Else → last syllable.
function findStressedIndex(originalWord: string, syllables: string[]): number {
  const bare = stripAccents(originalWord.toLowerCase());
  const accented = originalWord.normalize("NFD").match(/([aeiou])\u0301/i);
  if (accented) {
    // approximate: stress the syllable containing roughly that position
    // Fall through to default rules if we can't map cleanly.
  }
  if (originalWord !== stripAccents(originalWord)) {
    // Has an accent mark — try to locate it
    const idx = originalWord.normalize("NFD").search(/[\u0301]/);
    if (idx > 0) {
      // Rough mapping: count vowels up to idx in bare form
      let vCount = 0;
      for (let i = 0; i < idx - 1 && i < bare.length; i++) {
        if (VOWELS.has(bare[i])) vCount++;
      }
      return Math.min(vCount, syllables.length - 1);
    }
  }
  const last = bare[bare.length - 1] ?? "";
  if (VOWELS.has(last) || last === "n" || last === "s") {
    return Math.max(syllables.length - 2, 0);
  }
  return syllables.length - 1;
}

export function phoneticGuide(spanish: string): string {
  if (!spanish || !spanish.trim()) return "";
  const words = spanish.split(/\s+/);
  return words
    .map((w) => {
      const cleaned = w.replace(/[¿?¡!.,;:]/g, "");
      if (!cleaned) return "";
      const phon = phoneticForWord(cleaned);
      const syllables = syllabify(phon);
      if (syllables.length === 0) return phon;
      const stressIdx = findStressedIndex(cleaned, syllables);
      return syllables
        .map((s, i) => (i === stressIdx ? s.toUpperCase() : s))
        .join("-");
    })
    .filter(Boolean)
    .join(" ");
}
