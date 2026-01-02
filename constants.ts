import { TarotCardData } from './types';

export const MAJOR_ARCANA_NAMES = [
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
  "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
  "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
  "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgement", "The World"
];

export const SUITS = ["Wands", "Cups", "Swords", "Pentacles"];

export const generateDeck = (): TarotCardData[] => {
  const deck: TarotCardData[] = [];
  let id = 0;

  // Major Arcana
  MAJOR_ARCANA_NAMES.forEach((name) => {
    deck.push({ id: id++, isMajor: true, name, description: "Major Arcana - Destiny & Karma" });
  });

  // Minor Arcana
  SUITS.forEach((suit) => {
    for (let i = 1; i <= 14; i++) {
      let name = `${i} of ${suit}`;
      if (i === 1) name = `Ace of ${suit}`;
      if (i === 11) name = `Page of ${suit}`;
      if (i === 12) name = `Knight of ${suit}`;
      if (i === 13) name = `Queen of ${suit}`;
      if (i === 14) name = `King of ${suit}`;
      deck.push({ id: id++, isMajor: false, name, description: `Minor Arcana - ${suit}` });
    }
  });

  return deck;
};

export const DECK = generateDeck();