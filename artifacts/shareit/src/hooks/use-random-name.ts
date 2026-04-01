const ADJECTIVES = [
  "Sneaky", "Brave", "Fuzzy", "Grumpy", "Jolly", "Lazy", "Mighty",
  "Nimble", "Quirky", "Rowdy", "Spooky", "Tiny", "Witty", "Zany",
  "Clumsy", "Daring", "Elegant", "Fancy", "Gentle", "Hungry",
  "Icy", "Jumpy", "Keen", "Lucky", "Moody", "Noisy", "Oddly",
  "Peppy", "Rapid", "Silly", "Tidy", "Urban", "Vivid", "Wild",
];

const ANIMALS = [
  "Penguin", "Octopus", "Raccoon", "Capybara", "Axolotl", "Narwhal",
  "Platypus", "Quokka", "Wombat", "Pangolin", "Fennec", "Chameleon",
  "Meerkat", "Tapir", "Tardigrade", "Blobfish", "Mantis", "Lobster",
  "Salamander", "Porcupine", "Echidna", "Sloth", "Ocelot", "Binturong",
  "Aardvark", "Capuchin", "Marmoset", "Kinkajou", "Fossa", "Numbat",
];

function generateRandomName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adj} ${animal}`;
}

const STORAGE_KEY = "shareit_author_name";

export function getOrCreateAuthorName(): string {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const name = generateRandomName();
  localStorage.setItem(STORAGE_KEY, name);
  return name;
}

export function useAuthorName(): string {
  return getOrCreateAuthorName();
}
