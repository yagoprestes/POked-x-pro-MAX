export const TYPE_NAMES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
] as const;

export const TYPE_COLORS: Record<string, string> = {
  normal: '#a7a7a0', fire: '#f48a50', water: '#629ff5',
  electric: '#efbf43', grass: '#6fc783', ice: '#72cbd6',
  fighting: '#db6d61', poison: '#ad76d4', ground: '#cfaa65',
  flying: '#98a6e7', psychic: '#ed7ca6', bug: '#a8b94f',
  rock: '#b6a77b', ghost: '#8e7cb9', dragon: '#8173dd',
  dark: '#7d8293', steel: '#9baeba', fairy: '#e69cbe',
};

export const TYPE_LABELS: Record<string, string> = {
  normal: 'Normal', fire: 'Fogo', water: 'Água', electric: 'Elétrico',
  grass: 'Planta', ice: 'Gelo', fighting: 'Lutador', poison: 'Veneno',
  ground: 'Terra', flying: 'Voador', psychic: 'Psíquico', bug: 'Inseto',
  rock: 'Pedra', ghost: 'Fantasma', dragon: 'Dragão', dark: 'Sombrio',
  steel: 'Aço', fairy: 'Fada',
};

export const STAT_LABELS: Record<string, string> = {
  hp: 'HP', attack: 'Ataque', defense: 'Defesa',
  'special-attack': 'Atq. Especial', 'special-defense': 'Def. Especial',
  speed: 'Velocidade',
};

export const GENERATIONS = [
  { key: 'all', name: 'Todas as gerações', min: 1, max: Infinity },
  { key: 'kanto', name: 'I · Kanto', min: 1, max: 151 },
  { key: 'johto', name: 'II · Johto', min: 152, max: 251 },
  { key: 'hoenn', name: 'III · Hoenn', min: 252, max: 386 },
  { key: 'sinnoh', name: 'IV · Sinnoh', min: 387, max: 493 },
  { key: 'unova', name: 'V · Unova', min: 494, max: 649 },
  { key: 'kalos', name: 'VI · Kalos', min: 650, max: 721 },
  { key: 'alola', name: 'VII · Alola', min: 722, max: 809 },
  { key: 'galar', name: 'VIII · Galar', min: 810, max: 905 },
  { key: 'paldea', name: 'IX · Paldea', min: 906, max: 1025 },
] as const;

export const artworkUrl = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

export const spriteUrl = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

export const formatId = (id: number) => `#${String(id).padStart(4, '0')}`;

export const formatName = (name: string) =>
  name.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
