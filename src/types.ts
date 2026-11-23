export interface NamedResource {
  name: string;
  url: string;
}

export interface SpeciesEntry {
  id: number;
  name: string;
}

export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number | null;
  types: Array<{ slot: number; type: NamedResource }>;
  stats: Array<{ base_stat: number; stat: NamedResource }>;
  abilities: Array<{ is_hidden: boolean; ability: NamedResource }>;
  cries?: { latest: string | null; legacy: string | null };
}

export interface PokemonSpecies {
  id: number;
  name: string;
  color: NamedResource;
  capture_rate: number;
  is_legendary: boolean;
  is_mythical: boolean;
  habitat: NamedResource | null;
  generation: NamedResource;
  evolution_chain: { url: string } | null;
  flavor_text_entries: Array<{ flavor_text: string; language: NamedResource }>;
  genera: Array<{ genus: string; language: NamedResource }>;
}

export interface EvolutionDetail {
  min_level: number | null;
  item: NamedResource | null;
  held_item: NamedResource | null;
  trigger: NamedResource | null;
  min_happiness: number | null;
  time_of_day: string;
}

export interface EvolutionLink {
  species: NamedResource;
  evolution_details: EvolutionDetail[];
  evolves_to: EvolutionLink[];
}

export interface EvolutionChainResponse {
  chain: EvolutionLink;
}

export interface EvolutionStep {
  id: number;
  name: string;
  condition: string;
  stage: number;
}

export interface TypeResponse {
  pokemon: Array<{ pokemon: NamedResource }>;
  damage_relations: {
    double_damage_from: NamedResource[];
    half_damage_from: NamedResource[];
    no_damage_from: NamedResource[];
  };
}

export interface TypeWeakness {
  type: string;
  multiplier: number;
}
