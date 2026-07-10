const adjectives = [
  "silent", "lyric", "inked", "forgotten", "whispering", "midnight", "echoing",
  "weeping", "golden", "crimson", "sapphire", "emerald", "velvet", "frosty",
  "burning", "fading", "hollow", "sacred", "broken", "healing", "wanderer",
  "solitary", "hidden", "starlit", "moonlit", "sunlit", "twilight", "dusk",
  "dawn", "autumn", "winter", "spring", "summer", "oceanic", "celestial",
  "ethereal", "phantom", "ghostly", "shadowy", "luminescent", "radiant",
  "somber", "melancholy", "joyous", "tranquil", "serene", "stormy", "wild",
  "tame", "gentle", "fierce", "brave", "timid", "ancient", "modern", "timeless",
  "fleeting", "eternal", "infinite", "boundless", "limitless", "soaring"
];

const nouns = [
  "verse", "sonnet", "quill", "muse", "echo", "stanza", "rhyme", "rhythm",
  "meter", "poem", "poet", "bard", "lyre", "harp", "flute", "song", "melody",
  "harmony", "symphony", "chorus", "refrain", "ballad", "ode", "elegy", "haiku",
  "epic", "tale", "story", "myth", "legend", "fable", "dream", "vision",
  "illusion", "mirage", "phantom", "specter", "ghost", "spirit", "soul",
  "heart", "mind", "thought", "memory", "remembrance", "forgetfulness",
  "tear", "smile", "laugh", "sigh", "breath", "wind", "breeze", "gale",
  "storm", "tempest", "hurricane", "rain", "snow", "ice", "fire", "flame",
  "ember", "spark", "ash", "cinder", "smoke", "shadow", "light", "darkness",
  "star", "moon", "sun", "sky", "cloud", "ocean", "sea", "river", "stream",
  "lake", "pond", "forest", "wood", "tree", "leaf", "flower", "rose", "lily"
];

export const generateRandomUsername = () => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}_${noun}`;
};

export const generateAlternativeUsername = (baseUsername: string) => {
  const randomNum = Math.floor(Math.random() * 999) + 1;
  return `${baseUsername}${randomNum}`;
};
