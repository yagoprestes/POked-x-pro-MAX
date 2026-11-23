import { TYPE_NAMES } from './constants';
import type {
  EvolutionChainResponse, EvolutionDetail, EvolutionLink, EvolutionStep,
  NamedResource, Pokemon, PokemonSpecies, SpeciesEntry, TypeResponse, TypeWeakness,
} from './types';

const API_BASE = 'https://pokeapi.co/api/v2';
const pokemonCache = new Map<number, Promise<Pokemon>>();
const speciesCache = new Map<number, Promise<PokemonSpecies>>();
const typeCache = new Map<string, Promise<TypeResponse>>();

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Erro ao acessar a PokéAPI (${response.status}).`);
  return response.json() as Promise<T>;
}

// IDs são extraídos do endereço oficial da API, sem depender da ordem retornada.
export function resourceId(url: string): number {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : 0;
}

export async function getAllSpecies(): Promise<SpeciesEntry[]> {
  const result = await getJson<{ results: NamedResource[] }>(
    `${API_BASE}/pokemon-species?limit=2000`,
  );
  return result.results
    .map((species) => ({ id: resourceId(species.url), name: species.name }))
    .filter((species) => species.id > 0)
    .sort((a, b) => a.id - b.id);
}

export function getPokemon(id: number): Promise<Pokemon> {
  if (!pokemonCache.has(id)) {
    const request = getJson<Pokemon>(`${API_BASE}/pokemon/${id}`).catch((error: unknown) => {
      pokemonCache.delete(id);
      throw error;
    });
    pokemonCache.set(id, request);
  }
  return pokemonCache.get(id)!;
}

export function getSpecies(id: number): Promise<PokemonSpecies> {
  if (!speciesCache.has(id)) {
    const request = getJson<PokemonSpecies>(`${API_BASE}/pokemon-species/${id}`)
      .catch((error: unknown) => {
        speciesCache.delete(id);
        throw error;
      });
    speciesCache.set(id, request);
  }
  return speciesCache.get(id)!;
}

function getType(typeName: string): Promise<TypeResponse> {
  if (!typeCache.has(typeName)) {
    const request = getJson<TypeResponse>(`${API_BASE}/type/${typeName}`)
      .catch((error: unknown) => {
        typeCache.delete(typeName);
        throw error;
      });
    typeCache.set(typeName, request);
  }
  return typeCache.get(typeName)!;
}

export async function getPokemonIdsByType(typeName: string): Promise<Set<number>> {
  const type = await getType(typeName);
  return new Set(type.pokemon.map(({ pokemon }) => resourceId(pokemon.url)));
}

export async function getWeaknesses(defendingTypes: string[]): Promise<TypeWeakness[]> {
  const relations = await Promise.all(defendingTypes.map(getType));
  const multipliers: Record<string, number> = Object.fromEntries(
    TYPE_NAMES.map((type) => [type, 1]),
  );

  for (const type of relations) {
    for (const attacker of type.damage_relations.double_damage_from) {
      multipliers[attacker.name] *= 2;
    }
    for (const attacker of type.damage_relations.half_damage_from) {
      multipliers[attacker.name] *= 0.5;
    }
    for (const attacker of type.damage_relations.no_damage_from) {
      multipliers[attacker.name] = 0;
    }
  }

  return Object.entries(multipliers)
    .filter(([, multiplier]) => multiplier > 1)
    .map(([type, multiplier]) => ({ type, multiplier }))
    .sort((a, b) => b.multiplier - a.multiplier || a.type.localeCompare(b.type));
}

function describeEvolution(detail?: EvolutionDetail): string {
  if (!detail) return 'Forma inicial';
  if (detail.min_level != null) return `Nível ${detail.min_level}`;
  if (detail.item) return `Usar ${detail.item.name.replace(/-/g, ' ')}`;
  if (detail.held_item) return `Segurar ${detail.held_item.name.replace(/-/g, ' ')}`;
  if (detail.min_happiness != null) return 'Alta amizade';
  if (detail.time_of_day) return `Durante a ${detail.time_of_day === 'day' ? 'manhã/tarde' : 'noite'}`;
  if (detail.trigger?.name === 'trade') return 'Troca';
  return 'Condição especial';
}

function walkEvolution(link: EvolutionLink, stage: number, list: EvolutionStep[]) {
  const id = resourceId(link.species.url);
  if (id) {
    list.push({
      id,
      name: link.species.name,
      stage,
      condition: describeEvolution(link.evolution_details[0]),
    });
  }
  for (const next of link.evolves_to) walkEvolution(next, stage + 1, list);
}

export async function getEvolution(species: PokemonSpecies): Promise<EvolutionStep[]> {
  if (!species.evolution_chain) return [];
  const data = await getJson<EvolutionChainResponse>(species.evolution_chain.url);
  const steps: EvolutionStep[] = [];
  walkEvolution(data.chain, 0, steps);
  return steps;
}

export function getDescription(species: PokemonSpecies): string {
  const text = species.flavor_text_entries.find((entry) => entry.language.name === 'pt')
    ?? species.flavor_text_entries.find((entry) => entry.language.name === 'en');
  return text?.flavor_text.replace(/[\n\f\r]+/g, ' ').replace(/\s+/g, ' ').trim()
    ?? 'Este Pokémon ainda não tem uma descrição disponível.';
}

export function getCategory(species: PokemonSpecies): string {
  return species.genera.find((entry) => entry.language.name === 'pt')?.genus
    ?? species.genera.find((entry) => entry.language.name === 'en')?.genus
    ?? 'Pokémon';
}
