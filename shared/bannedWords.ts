export const BANNED_WORDS: string[] = [
  // === Bahasa Indonesia — kasar / toxic ===
  "anjing", "anjir", "anjrit",
  "bangsat",
  "brengsek",
  "bajingan",
  "babi",
  "kontol", "kntl",
  "memek",
  "ngentot", "ngenot",
  "pepek",
  "jancok", "jancuk", "jancik", "janceg",
  "asu",
  "celeng",
  "goblok",
  "tolol",
  "sialan",
  "kampret",
  "tai", "taik",
  "kimak",
  "pukimak",
  "pantat",
  "titit",
  "pelacur",
  "sundal", "sundel",
  "bedebah",
  "keparat",
  "bego",
  "dungu",
  "idiot",
  "bodoh",
  "bacot",
  "setan",
  "iblis",
  "laknat",
  "bangke",
  "bangkai",
  "monyet",
  "koplak",
  "edan",
  "gila",
  "gebleg",
  "lonte",
  "jablay",
  "preman",
  "berengsek",
  // === English — vulgar / toxic ===
  "fuck", "fvck",
  "shit",
  "bitch",
  "pussy",
  "dick",
  "cunt",
  "whore",
  "nigger", "nigga",
  "bastard",
  "slut",
  "cock",
  "penis",
  "vagina",
  "porn",
  "rape",
  "kill",
  "nazi",
  "hitler",
  "faggot", "fag",
  "retard",
  "twat",
  "asshole", "arsehole",
  "motherfucker", "mofo",
  "bullshit",
  // === Kata sistem yang dilarang ===
  "admin", "administrator",
  "root",
  "system",
  "support",
  "wooce",
  "moderator",
  "official",
  "staff",
  "superuser",
  "bot",
  "null",
  "undefined",
  "deleted",
  "anonymous",
];

export function isBannedNickname(slug: string): boolean {
  const stripped = slug.toLowerCase().replace(/-/g, "");
  const parts = slug.toLowerCase().split("-").filter(Boolean);

  for (const banned of BANNED_WORDS) {
    const clean = banned.replace(/[^a-z0-9]/g, "");
    if (!clean) continue;
    if (stripped === clean) return true;
    if (stripped.includes(clean)) return true;
    for (const part of parts) {
      if (part === clean) return true;
    }
  }
  return false;
}
