/**
 * Shows a person's or boat's name in Kannada script.
 *
 * Names cannot be "translated", only written in the other script. The fisher can
 * type the exact Kannada spelling in their profile; when they have not, this makes
 * a best-effort Kannada spelling from the English letters (common coastal names are
 * looked up first, the rest is spelled out sound by sound). The automatic spelling
 * can be imperfect, which is why the profile lets the fisher correct it.
 */

const KNOWN_WORDS: Record<string, string> = {
  ramesh: 'ರಮೇಶ್', suresh: 'ಸುರೇಶ್', mahesh: 'ಮಹೇಶ್', ganesh: 'ಗಣೇಶ್', rajesh: 'ರಾಜೇಶ್',
  dinesh: 'ದಿನೇಶ್', naresh: 'ನರೇಶ್', umesh: 'ಉಮೇಶ್', yogesh: 'ಯೋಗೇಶ್', girish: 'ಗಿರೀಶ್',
  harish: 'ಹರೀಶ್', satish: 'ಸತೀಶ್', sathish: 'ಸತೀಶ್', manish: 'ಮನೀಶ್', prakash: 'ಪ್ರಕಾಶ್',
  kumar: 'ಕುಮಾರ್', kumara: 'ಕುಮಾರ', raj: 'ರಾಜ್', raju: 'ರಾಜು', ravi: 'ರವಿ', ram: 'ರಾಮ್',
  rama: 'ರಾಮ', krishna: 'ಕೃಷ್ಣ', shiva: 'ಶಿವ', shankar: 'ಶಂಕರ್', mohan: 'ಮೋಹನ್',
  manjunath: 'ಮಂಜುನಾಥ್', manju: 'ಮಂಜು', nagaraj: 'ನಾಗರಾಜ್', nagesh: 'ನಾಗೇಶ್', vasudev: 'ವಾಸುದೇವ್',
  ashok: 'ಅಶೋಕ್', anand: 'ಆನಂದ್', arun: 'ಅರುಣ್', kiran: 'ಕಿರಣ್', praveen: 'ಪ್ರವೀಣ್',
  naveen: 'ನವೀನ್', sachin: 'ಸಚಿನ್', sunil: 'ಸುನಿಲ್', vinod: 'ವಿನೋದ್', vijay: 'ವಿಜಯ್',
  santosh: 'ಸಂತೋಷ್', lokesh: 'ಲೋಕೇಶ್', deepak: 'ದೀಪಕ್', gopal: 'ಗೋಪಾಲ್', narayan: 'ನಾರಾಯಣ್',
  narayana: 'ನಾರಾಯಣ', lakshmi: 'ಲಕ್ಷ್ಮಿ', gowri: 'ಗೌರಿ', savitha: 'ಸವಿತಾ', sunitha: 'ಸುನೀತಾ',
  shetty: 'ಶೆಟ್ಟಿ', poojary: 'ಪೂಜಾರಿ', pujari: 'ಪೂಜಾರಿ', naik: 'ನಾಯ್ಕ', nayak: 'ನಾಯಕ್',
  gowda: 'ಗೌಡ', rao: 'ರಾವ್', bhat: 'ಭಟ್', bhatt: 'ಭಟ್', kharvi: 'ಖಾರ್ವಿ', mogaveera: 'ಮೊಗವೀರ',
  bangera: 'ಬಂಗೇರ', salian: 'ಸಾಲಿಯಾನ್', kotian: 'ಕೋಟ್ಯಾನ್', suvarna: 'ಸುವರ್ಣ', karkera: 'ಕರ್ಕೇರ',
  amin: 'ಅಮೀನ್', tandel: 'ತಾಂಡೇಲ್', harikantra: 'ಹರಿಕಂತ್ರ', ambiga: 'ಅಂಬಿಗ', moger: 'ಮೊಗೇರ',
  fernandes: 'ಫೆರ್ನಾಂಡಿಸ್', dsouza: 'ಡಿಸೋಜ', anna: 'ಅಣ್ಣ', akka: 'ಅಕ್ಕ',
  sagar: 'ಸಾಗರ್', sagara: 'ಸಾಗರ', rani: 'ರಾಣಿ', matsya: 'ಮತ್ಸ್ಯ', mitra: 'ಮಿತ್ರ',
  samudra: 'ಸಮುದ್ರ', kadalu: 'ಕಡಲು', jai: 'ಜೈ', sri: 'ಶ್ರೀ', shree: 'ಶ್ರೀ', devi: 'ದೇವಿ',
  durga: 'ದುರ್ಗಾ', hanuman: 'ಹನುಮಾನ್', mahalakshmi: 'ಮಹಾಲಕ್ಷ್ಮಿ', star: 'ಸ್ಟಾರ್', sea: 'ಸೀ',
  king: 'ಕಿಂಗ್', queen: 'ಕ್ವೀನ್',
  akash: 'ಆಕಾಶ್', harsha: 'ಹರ್ಷ', harsh: 'ಹರ್ಷ', varsha: 'ವರ್ಷಾ', pooja: 'ಪೂಜಾ', devraj: 'ದೇವರಾಜ್',
  mohammed: 'ಮೊಹಮ್ಮದ್', mohammad: 'ಮೊಹಮ್ಮದ್', abdul: 'ಅಬ್ದುಲ್', ibrahim: 'ಇಬ್ರಾಹಿಂ', ismail: 'ಇಸ್ಮಾಯಿಲ್',
  stephen: 'ಸ್ಟೀಫನ್', john: 'ಜಾನ್', joseph: 'ಜೋಸೆಫ್', peter: 'ಪೀಟರ್', antony: 'ಆಂಟನಿ', anthony: 'ಆಂಟನಿ',
  ajay: 'ಅಜಯ್', amit: 'ಅಮಿತ್', anil: 'ಅನಿಲ್', aditya: 'ಆದಿತ್ಯ', arjun: 'ಅರ್ಜುನ್', karthik: 'ಕಾರ್ತಿಕ್',
  kartik: 'ಕಾರ್ತಿಕ್', rahul: 'ರಾಹುಲ್', rohit: 'ರೋಹಿತ್', rohith: 'ರೋಹಿತ್', sandeep: 'ಸಂದೀಪ್', pradeep: 'ಪ್ರದೀಪ್',
  raghu: 'ರಘು', raghavendra: 'ರಾಘವೇಂದ್ರ', shashi: 'ಶಶಿ', vishnu: 'ವಿಷ್ಣು', vishal: 'ವಿಶಾಲ್', nithin: 'ನಿತಿನ್',
  nitin: 'ನಿತಿನ್', varun: 'ವರುಣ್', tarun: 'ತರುಣ್', bharath: 'ಭರತ್', bharat: 'ಭರತ್', abhishek: 'ಅಭಿಷೇಕ್',
};

// Longest spellings first so "ksh" wins over "k" + "sh".
const CONSONANTS: [string, string][] = [
  ['ksh', 'ಕ್ಷ'], ['chh', 'ಛ'], ['shr', 'ಶ್ರ'], ['sh', 'ಶ'], ['ch', 'ಚ'], ['th', 'ತ'], ['dh', 'ಧ'],
  ['bh', 'ಭ'], ['ph', 'ಫ'], ['kh', 'ಖ'], ['gh', 'ಘ'], ['jh', 'ಝ'], ['ny', 'ನ್ಯ'],
  ['k', 'ಕ'], ['g', 'ಗ'], ['c', 'ಕ'], ['j', 'ಜ'], ['t', 'ಟ'], ['d', 'ದ'], ['n', 'ನ'], ['p', 'ಪ'],
  ['b', 'ಬ'], ['m', 'ಮ'], ['y', 'ಯ'], ['r', 'ರ'], ['l', 'ಲ'], ['v', 'ವ'], ['w', 'ವ'], ['s', 'ಸ'],
  ['h', 'ಹ'], ['f', 'ಫ'], ['z', 'ಜ'], ['q', 'ಕ'], ['x', 'ಕ್ಸ'],
];

// [spelling, standalone letter, sign after a consonant]
const VOWELS: [string, string, string][] = [
  ['aa', 'ಆ', 'ಾ'], ['ai', 'ಐ', 'ೈ'], ['au', 'ಔ', 'ೌ'], ['ou', 'ಔ', 'ೌ'], ['ee', 'ಈ', 'ೀ'],
  ['ii', 'ಈ', 'ೀ'], ['oo', 'ಊ', 'ೂ'], ['uu', 'ಊ', 'ೂ'],
  ['a', 'ಅ', ''], ['i', 'ಇ', 'ಿ'], ['u', 'ಉ', 'ು'], ['e', 'ಏ', 'ೇ'], ['o', 'ಓ', 'ೋ'],
];

const VIRAMA = '್';

function spellWord(word: string): string {
  const lower = word.toLowerCase();
  if (KNOWN_WORDS[lower]) return KNOWN_WORDS[lower];

  let out = '';
  let i = 0;
  let pendingConsonant = false; // last thing written was a consonant still waiting for its vowel

  while (i < lower.length) {
    const rest = lower.slice(i);

    const vowel = VOWELS.find(([spelling]) => rest.startsWith(spelling));
    if (vowel) {
      out += pendingConsonant ? vowel[2] : vowel[1];
      pendingConsonant = false;
      i += vowel[0].length;
      continue;
    }

    const consonant = CONSONANTS.find(([spelling]) => rest.startsWith(spelling));
    if (consonant) {
      if (pendingConsonant) out += VIRAMA; // two consonants in a row join into a cluster
      out += consonant[1];
      pendingConsonant = true;
      i += consonant[0].length;
      continue;
    }

    // Digits, dots, hyphens: keep as they are.
    if (pendingConsonant) out += VIRAMA;
    pendingConsonant = false;
    out += lower[i];
    i += 1;
  }

  // A name ending in a consonant sound ("Ramesh") is written with a closed final letter.
  if (pendingConsonant) out += VIRAMA;
  return out;
}

/** Best-effort Kannada spelling of an English-letter name. */
export function toKannadaScript(name: string): string {
  const clean = (name || '').trim();
  if (!clean) return '';
  // Already contains Kannada letters — leave it exactly as typed.
  if (/[ಀ-೿]/.test(clean)) return clean;
  return clean
    .split(/\s+/)
    .map((word) => spellWord(word))
    .join(' ');
}

/**
 * Name to show in the current app language: the fisher's own Kannada spelling if
 * they gave one, otherwise the automatic spelling; English is shown as typed.
 */
export function nameForLanguage(
  name: string | null | undefined,
  kannadaName: string | null | undefined,
  language: string,
): string {
  const base = (name || '').trim();
  if (language !== 'kn') return base;
  const own = (kannadaName || '').trim();
  return own || toKannadaScript(base);
}
