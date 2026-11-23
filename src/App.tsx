import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Check,
  ChevronDown, ExternalLink, Heart, Info, LoaderCircle, RotateCcw,
  Search, Shuffle, SlidersHorizontal, Sparkles, Volume2, X,
} from 'lucide-react';
import {
  getAllSpecies, getCategory, getDescription, getEvolution, getPokemon,
  getPokemonIdsByType, getSpecies, getWeaknesses,
} from './api';
import {
  artworkUrl, formatId, formatName, GENERATIONS, spriteUrl,
  STAT_LABELS, TYPE_COLORS, TYPE_LABELS, TYPE_NAMES,
} from './constants';
import type { EvolutionStep, Pokemon, PokemonSpecies, SpeciesEntry, TypeWeakness } from './types';
import './App.css';

type View = 'all' | 'favorites';
type Sort = 'number-asc' | 'number-desc' | 'name-asc' | 'name-desc';
const PAGE_SIZE = 24;

function loadFavorites(): number[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem('pokedex-favorites') ?? '[]');
    return Array.isArray(stored)
      ? stored.filter((id): id is number => Number.isInteger(id) && id > 0)
      : [];
  } catch {
    return [];
  }
}

function PokemonImage({ id, name, className = '' }: { id: number; name: string; className?: string }) {
  return (
    <img
      className={className}
      src={artworkUrl(id)}
      alt={formatName(name)}
      loading="lazy"
      onError={(event) => {
        const image = event.currentTarget;
        if (!image.src.includes('/other/official-artwork/')) return;
        image.src = spriteUrl(id);
      }}
    />
  );
}

function TypePill({ type, small = false }: { type: string; small?: boolean }) {
  return (
    <span
      className={`type-pill ${small ? 'type-pill-small' : ''}`}
      style={{ '--pill-color': TYPE_COLORS[type] ?? '#94a3b8' } as CSSProperties}
    >
      <span className="type-dot" />
      {TYPE_LABELS[type] ?? formatName(type)}
    </span>
  );
}

function PokemonCard({
  item, favorite, onSelect, onFavorite,
}: {
  item: SpeciesEntry;
  favorite: boolean;
  onSelect: (id: number) => void;
  onFavorite: (id: number) => void;
}) {
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setPokemon(null);
    setFailed(false);
    getPokemon(item.id)
      .then((result) => { if (active) setPokemon(result); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [item.id]);

  const primaryType = pokemon?.types[0]?.type.name ?? 'normal';
  const accent = TYPE_COLORS[primaryType] ?? '#9ca3af';

  return (
    <article className="pokemon-card" style={{ '--accent': accent } as CSSProperties}>
      <button
        type="button"
        className={`favorite-button ${favorite ? 'is-favorite' : ''}`}
        aria-label={`${favorite ? 'Remover' : 'Adicionar'} ${formatName(item.name)} ${favorite ? 'dos' : 'aos'} favoritos`}
        title={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        onClick={() => onFavorite(item.id)}
      >
        <Heart size={18} strokeWidth={2} fill={favorite ? 'currentColor' : 'none'} />
      </button>
      <button className="card-open" type="button" onClick={() => onSelect(item.id)}>
        <div className="card-topline">
          <span className="card-number">{formatId(item.id)}</span>
          <ArrowUpRight size={17} className="card-arrow" />
        </div>
        <div className="card-art">
          <div className="card-art-orb" />
          <div className="card-art-ring" />
          <PokemonImage id={item.id} name={item.name} />
        </div>
        <div className="card-info">
          <h3>{formatName(item.name)}</h3>
          <div className="card-types">
            {pokemon
              ? pokemon.types.map((entry) => <TypePill key={entry.type.name} type={entry.type.name} small />)
              : failed
                ? <span className="card-placeholder">Ver detalhes</span>
                : <span className="type-loading" aria-label="Carregando tipos" />}
          </div>
        </div>
      </button>
    </article>
  );
}

function DetailModal({
  id, maxId, isFavorite, onFavorite, onClose, onSelect,
}: {
  id: number;
  maxId: number;
  isFavorite: boolean;
  onFavorite: (id: number) => void;
  onClose: () => void;
  onSelect: (id: number) => void;
}) {
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [species, setSpecies] = useState<PokemonSpecies | null>(null);
  const [evolutions, setEvolutions] = useState<EvolutionStep[]>([]);
  const [weaknesses, setWeaknesses] = useState<TypeWeakness[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', escape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', escape);
    };
  }, [onClose]);

  useEffect(() => {
    let active = true;
    setPokemon(null);
    setSpecies(null);
    setEvolutions([]);
    setWeaknesses([]);
    setLoadingExtras(true);
    setError('');

    Promise.all([getPokemon(id), getSpecies(id)])
      .then(async ([pokemonData, speciesData]) => {
        if (!active) return;
        setPokemon(pokemonData);
        setSpecies(speciesData);
        const [evolutionResult, weaknessResult] = await Promise.allSettled([
          getEvolution(speciesData),
          getWeaknesses(pokemonData.types.map((entry) => entry.type.name)),
        ]);
        if (!active) return;
        if (evolutionResult.status === 'fulfilled') setEvolutions(evolutionResult.value);
        if (weaknessResult.status === 'fulfilled') setWeaknesses(weaknessResult.value);
        setLoadingExtras(false);
      })
      .catch(() => {
        if (active) {
          setError('Não foi possível abrir os detalhes. Verifique sua conexão.');
          setLoadingExtras(false);
        }
      });

    return () => { active = false; };
  }, [id]);

  const primaryType = pokemon?.types[0]?.type.name ?? 'normal';
  const accent = TYPE_COLORS[primaryType] ?? '#94a3b8';
  const totalStats = pokemon?.stats.reduce((sum, stat) => sum + stat.base_stat, 0) ?? 0;
  const playCry = () => {
    const url = pokemon?.cries?.latest ?? pokemon?.cries?.legacy;
    if (url) void new Audio(url).play().catch(() => undefined);
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section
        className="detail-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes do Pokémon ${pokemon ? formatName(pokemon.name) : id}`}
        style={{ '--accent': accent } as CSSProperties}
      >
        <div className="modal-toolbar">
          <div className="modal-breadcrumb"><span>POKÉDEX</span><span>/</span><strong>{formatId(id)}</strong></div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar detalhes" type="button"><X size={20} /></button>
        </div>

        {error ? (
          <div className="detail-error"><Info size={30} /><p>{error}</p><button type="button" onClick={onClose}>Fechar</button></div>
        ) : !pokemon || !species ? (
          <div className="detail-loading"><LoaderCircle className="spin" size={34} /><p>Consultando a Pokédex...</p></div>
        ) : (
          <>
            <div className="detail-head">
              <div className="detail-art-panel">
                <div className="detail-rings" />
                <span className="detail-art-label">#{String(id).padStart(4, '0')}</span>
                <PokemonImage id={id} name={pokemon.name} />
              </div>
              <div className="detail-intro">
                <div className="detail-eyebrow">{species.is_mythical ? '✦ Pokémon mítico' : species.is_legendary ? '✦ Pokémon lendário' : getCategory(species)}</div>
                <h2>{formatName(pokemon.name)}</h2>
                <div className="detail-types">{pokemon.types.map(({ type }) => <TypePill key={type.name} type={type.name} />)}</div>
                <p className="detail-description">{getDescription(species)}</p>
                <div className="detail-metrics">
                  <div><span>ALTURA</span><strong>{(pokemon.height / 10).toLocaleString('pt-BR')} m</strong></div>
                  <div><span>PESO</span><strong>{(pokemon.weight / 10).toLocaleString('pt-BR')} kg</strong></div>
                  <div><span>CAPTURA</span><strong>{species.capture_rate} <small>/ 255</small></strong></div>
                </div>
                <div className="detail-actions">
                  <button type="button" className={`detail-favorite ${isFavorite ? 'saved' : ''}`} onClick={() => onFavorite(id)}>
                    <Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} />
                    {isFavorite ? 'Salvo nos favoritos' : 'Adicionar aos favoritos'}
                  </button>
                  {(pokemon.cries?.latest || pokemon.cries?.legacy) && (
                    <button type="button" className="detail-cry" onClick={playCry} title="Ouvir o som do Pokémon" aria-label="Ouvir o som do Pokémon"><Volume2 size={19} /></button>
                  )}
                </div>
              </div>
            </div>

            <div className="detail-columns">
              <div className="detail-section">
                <div className="detail-section-title"><h3>Estatísticas base</h3><span className="stat-total">TOTAL {totalStats}</span></div>
                <div className="stats-list">
                  {pokemon.stats.map(({ stat, base_stat }) => (
                    <div className="stat-row" key={stat.name}>
                      <span>{STAT_LABELS[stat.name] ?? formatName(stat.name)}</span>
                      <strong>{base_stat}</strong>
                      <div className="stat-track"><div style={{ width: `${Math.min(100, (base_stat / 255) * 100)}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="detail-section">
                <div className="detail-section-title"><h3>Características</h3></div>
                <div className="attributes">
                  <div><span>Habilidades</span><strong>{pokemon.abilities.map(({ ability }) => formatName(ability.name)).join(', ')}</strong></div>
                  <div><span>Experiência base</span><strong>{pokemon.base_experience ?? '—'}</strong></div>
                  <div><span>Geração</span><strong>{formatName(species.generation.name.replace('generation-', 'Geração '))}</strong></div>
                  <div><span>Habitat</span><strong>{species.habitat ? formatName(species.habitat.name) : 'Desconhecido'}</strong></div>
                </div>
                <div className="weakness-header">Fraquezas {loadingExtras && <LoaderCircle size={13} className="spin" />}</div>
                <div className="weakness-list">
                  {!loadingExtras && weaknesses.length === 0 ? <span className="muted-small">Nenhuma fraqueza identificada</span> : weaknesses.map(({ type, multiplier }) => (
                    <div className="weakness-item" key={type}><TypePill type={type} small /><span>{multiplier}×</span></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="evolution-section">
              <div className="detail-section-title"><h3>Linha evolutiva</h3><span className="muted-small">Clique para ver outro Pokémon</span></div>
              {loadingExtras ? <div className="evolution-loading"><LoaderCircle className="spin" size={18} /> Carregando evoluções...</div> : evolutions.length ? (
                <div className="evolution-chain">
                  {evolutions.map((step) => (
                    <button type="button" className={`evolution-item ${step.id === id ? 'current-evolution' : ''}`} key={`${step.id}-${step.stage}`} onClick={() => onSelect(step.id)}>
                      <div className="evolution-image"><PokemonImage id={step.id} name={step.name} /></div>
                      <span className="evolution-name">{formatName(step.name)}</span>
                      <span className="evolution-condition">{step.condition}</span>
                    </button>
                  ))}
                </div>
              ) : <p className="muted-small">Evoluções não disponíveis.</p>}
            </div>

            <div className="detail-footer">
              <button type="button" disabled={id <= 1} onClick={() => onSelect(id - 1)}><ArrowLeft size={17} /> Anterior</button>
              <span>Pokédex Nacional</span>
              <button type="button" disabled={id >= maxId} onClick={() => onSelect(id + 1)}>Próximo <ArrowRight size={17} /></button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function App() {
  const [species, setSpecies] = useState<SpeciesEntry[]>([]);
  const [favorites, setFavorites] = useState<number[]>(loadFavorites);
  const [view, setView] = useState<View>('all');
  const [search, setSearch] = useState('');
  const [generation, setGeneration] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [typeIds, setTypeIds] = useState<Set<number> | null>(null);
  const [sort, setSort] = useState<Sort>('number-asc');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typeLoading, setTypeLoading] = useState(false);
  const [error, setError] = useState('');
  const [typeError, setTypeError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getAllSpecies()
      .then((items) => { if (active) setSpecies(items); })
      .catch(() => { if (active) setError('Não conseguimos acessar a PokéAPI. Confira sua internet e tente novamente.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  useEffect(() => {
    try { localStorage.setItem('pokedex-favorites', JSON.stringify(favorites)); } catch { /* navegação privada */ }
  }, [favorites]);

  useEffect(() => {
    let active = true;
    if (typeFilter === 'all') {
      setTypeIds(null);
      setTypeLoading(false);
      setTypeError('');
      return;
    }
    setTypeIds(null);
    setTypeLoading(true);
    setTypeError('');
    getPokemonIdsByType(typeFilter)
      .then((ids) => { if (active) setTypeIds(ids); })
      .catch(() => { if (active) setTypeError('Falha ao carregar o filtro. Selecione outro tipo.'); })
      .finally(() => { if (active) setTypeLoading(false); });
    return () => { active = false; };
  }, [typeFilter]);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [view, search, generation, typeFilter, sort]);

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
  const currentGeneration = GENERATIONS.find((item) => item.key === generation) ?? GENERATIONS[0];
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase().replace(/^#/, '');
    const list = species.filter((item) => {
      if (view === 'favorites' && !favoriteSet.has(item.id)) return false;
      if (item.id < currentGeneration.min || item.id > currentGeneration.max) return false;
      if (typeFilter !== 'all' && !typeIds?.has(item.id)) return false;
      if (!query) return true;
      return item.name.includes(query) || (/^\d+$/.test(query) && String(item.id).startsWith(String(Number(query))));
    });
    return list.sort((a, b) => {
      switch (sort) {
        case 'number-desc': return b.id - a.id;
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        default: return a.id - b.id;
      }
    });
  }, [species, view, favoriteSet, currentGeneration, typeFilter, typeIds, search, sort]);

  const visible = filtered.slice(0, visibleCount);
  const maxId = species.at(-1)?.id ?? 1025;
  const isFiltering = search !== '' || generation !== 'all' || typeFilter !== 'all';
  const toggleFavorite = (id: number) => {
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };
  const clearFilters = () => { setSearch(''); setGeneration('all'); setTypeFilter('all'); setSort('number-asc'); };
  const surpriseMe = () => {
    const candidates = filtered.length > 0 ? filtered : species;
    if (candidates.length > 0) {
      setSelectedId(candidates[Math.floor(Math.random() * candidates.length)].id);
    }
  };
  const switchView = (next: View) => {
    setView(next);
    document.getElementById('explorar')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand" onClick={() => switchView('all')} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') switchView('all'); }}>
          <span className="pokeball-logo"><span /></span>
          <span className="brand-copy"><strong>POKÉDEX<span>.</span></strong><small>EXPLORER EDITION</small></span>
        </div>
        <div className="side-menu-label">MENU PRINCIPAL</div>
        <nav className="side-navigation" aria-label="Menu principal">
          <button type="button" className={`side-link ${view === 'all' ? 'active' : ''}`} onClick={() => switchView('all')}><BookOpen size={19} /> Pokédex <span className="side-link-trailing"><ArrowUpRight size={15} /></span></button>
          <button type="button" className={`side-link ${view === 'favorites' ? 'active' : ''}`} onClick={() => switchView('favorites')}><Heart size={19} /> Favoritos <span className="side-count">{favorites.length}</span></button>
          <button type="button" className="side-link" onClick={() => setShowAbout(true)}><Info size={19} /> Sobre o projeto</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="trainer-tip"><div className="tip-icon"><Sparkles size={18} /></div><strong>Dica do treinador</strong><p>Toque em qualquer Pokémon para descobrir seus atributos e evoluções.</p></div>
          <div className="sidebar-foot"><span className="online-dot" /> POKÉAPI CONNECTED</div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-location"><span>EXPLORE</span><span className="topbar-slash">/</span><strong>{view === 'favorites' ? 'Meus favoritos' : 'Pokédex Nacional'}</strong></div>
          <div className="topbar-right"><span className="topbar-count"><span className="online-dot" /> DADOS DA POKÉAPI</span><button type="button" className="topbar-random" onClick={surpriseMe} disabled={species.length === 0}><Shuffle size={15} /> Pokémon aleatório</button></div>
        </header>

        <main className="main-content">
          <section className="hero">
            <div className="hero-grid" />
            <div className="hero-copy">
              <span className="hero-eyebrow"><span>✦</span> O UNIVERSO POKÉMON EM SUAS MÃOS</span>
              <h1>Gotta catch <br /><em>'em all.</em></h1>
              <p>Uma jornada por cada Pokémon. Explore espécies, descubra habilidades e monte sua coleção de favoritos.</p>
              <button type="button" className="hero-button" onClick={() => document.getElementById('explorar')?.scrollIntoView({ behavior: 'smooth' })}>Explorar Pokédex <ArrowDown size={17} /></button>
            </div>
            <div className="hero-illustration" aria-hidden="true">
              <div className="hero-circle-large" /><div className="hero-circle-inner" />
              <PokemonImage id={6} name="charizard" className="hero-charizard" />
              <PokemonImage id={25} name="pikachu" className="hero-pikachu" />
              <span className="hero-figure-label">NO. 006 <b>CHARIZARD</b></span>
            </div>
            <div className="hero-corner"><span>01 / 09</span><span>POKÉDEX</span></div>
          </section>

          <div className="overview-strip">
            <div className="overview-item"><span className="overview-icon overview-red"><BookOpen size={20} /></span><div><strong>{species.length ? species.length.toLocaleString('pt-BR') : '—'}</strong><small>Espécies registradas</small></div></div>
            <div className="overview-item"><span className="overview-icon overview-purple"><Sparkles size={20} /></span><div><strong>18</strong><small>Tipos Pokémon</small></div></div>
            <div className="overview-item"><span className="overview-icon overview-yellow"><Heart size={20} /></span><div><strong>{favorites.length}</strong><small>Meus favoritos</small></div></div>
          </div>

          <section className="explore-section" id="explorar">
            <div className="section-heading">
              <div><span className="section-overline">DESCUBRA &amp; COLECIONE</span><h2>{view === 'favorites' ? 'Seus favoritos' : 'Explore a Pokédex'}<span className="heading-period">.</span></h2><p>{view === 'favorites' ? 'Os Pokémon que ganharam um espaço especial na sua coleção.' : 'Todos os Pokémon, um universo inteiro para descobrir.'}</p></div>
              <div className="heading-meta"><span className="heading-meta-line" /><span>DATABASE / NATIONAL</span></div>
            </div>

            <div className="filters-panel">
              <div className="filters-row">
                <label className="search-box"><Search size={19} /><input aria-label="Pesquisar Pokémon" placeholder="Buscar por nome ou número..." value={search} onChange={(event) => setSearch(event.target.value)} />{search && <button type="button" aria-label="Limpar busca" onClick={() => setSearch('')}><X size={16} /></button>}<kbd>⌕</kbd></label>
                <label className="select-box"><SlidersHorizontal size={17} /><select aria-label="Filtrar por geração" value={generation} onChange={(event) => setGeneration(event.target.value)}>{GENERATIONS.map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}</select><ChevronDown className="select-chevron" size={16} /></label>
                <label className="select-box sort-box"><select aria-label="Ordenar Pokémon" value={sort}onChange={(event) => setSort(event.target.value as Sort)}><option value="number-asc">Menor número</option><option value="number-desc">Maior número</option><option value="name-asc">Nome A–Z</option><option value="name-desc">Nome Z–A</option></select><ChevronDown className="select-chevron" size={16} /></label>
              </div>
              <div className="type-filter-row"><span className="type-filter-label">TIPO</span><div className="type-filter-scroller"><button type="button" className={`type-filter-button all-type ${typeFilter === 'all' ? 'selected' : ''}`} onClick={() => setTypeFilter('all')}>Todos</button>{TYPE_NAMES.map((type) => <button type="button" key={type} className={`type-filter-button ${typeFilter === type ? 'selected' : ''}`} style={{ '--accent': TYPE_COLORS[type] } as CSSProperties} onClick={() => setTypeFilter(type)}><span className="type-filter-dot" />{TYPE_LABELS[type]}</button>)}</div></div>
            </div>

            <div className="results-heading"><div><h3>{view === 'favorites' ? 'Minha coleção' : 'Catálogo Pokémon'}</h3><span>{loading || typeLoading ? 'Carregando resultados...' : `${filtered.length.toLocaleString('pt-BR')} Pokémon encontrados`}</span></div>{isFiltering && <button type="button" className="clear-button" onClick={clearFilters}><RotateCcw size={15} /> Limpar filtros</button>}</div>

            {error ? (
              <div className="empty-state"><div className="empty-icon"><Info size={29} /></div><h3>Ops! Algo deu errado.</h3><p>{error}</p><button type="button" onClick={() => setReloadKey((n) => n + 1)}><RotateCcw size={16} /> Tentar novamente</button></div>
            ) : typeError ? (
              <div className="empty-state"><div className="empty-icon"><Info size={29} /></div><h3>Não conseguimos filtrar por tipo.</h3><p>{typeError}</p><button type="button" onClick={() => setTypeFilter('all')}>Exibir todos</button></div>
            ) : loading || typeLoading ? (
              <div className="pokemon-grid">{Array.from({ length: 12 }, (_, index) => <div key={index} className="card-skeleton"><div className="skeleton-line short" /><div className="skeleton-art" /><div className="skeleton-line" /><div className="skeleton-line medium" /></div>)}</div>
            ) : filtered.length > 0 ? (
              <>
                <div className="pokemon-grid">{visible.map((item) => <PokemonCard key={item.id} item={item} favorite={favoriteSet.has(item.id)} onSelect={setSelectedId} onFavorite={toggleFavorite} />)}</div>
                {visibleCount < filtered.length && <div className="load-more"><p>Mostrando <strong>{visible.length}</strong> de <strong>{filtered.length.toLocaleString('pt-BR')}</strong> Pokémon</p><button type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>Carregar mais Pokémon <ArrowDown size={17} /></button></div>}
              </>
            ) : (
              <div className="empty-state"><div className="empty-icon">{view === 'favorites' ? <Heart size={32} /> : <Search size={32} />}</div><h3>{view === 'favorites' ? 'Sua coleção está vazia' : 'Nenhum Pokémon encontrado'}</h3><p>{view === 'favorites' ? 'Adicione Pokémon ao clicar no coração de um card.' : 'Tente pesquisar outro nome, número ou remover os filtros.'}</p><button type="button" onClick={() => { clearFilters(); if (view === 'favorites') setView('all'); }}>{view === 'favorites' ? 'Explorar Pokémon' : 'Limpar filtros'} <ArrowRight size={16} /></button></div>
            )}
          </section>
          <footer className="page-footer"><div className="footer-brand"><span className="mini-pokeball" /> POKÉDEX EXPLORER <span>© {new Date().getFullYear()}</span></div><span>Feito com React + TypeScript · Dados da <a href="https://pokeapi.co/" target="_blank" rel="noreferrer">PokéAPI <ExternalLink size={12} /></a></span></footer>
        </main>
      </div>

      {selectedId !== null && <DetailModal id={selectedId} maxId={maxId} isFavorite={favoriteSet.has(selectedId)} onFavorite={toggleFavorite} onClose={() => setSelectedId(null)} onSelect={setSelectedId} />}
      {showAbout && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAbout(false); }}><section className="about-modal" role="dialog" aria-modal="true" aria-label="Sobre a Pokédex"><button type="button" className="modal-close" onClick={() => setShowAbout(false)} aria-label="Fechar"><X size={20} /></button><div className="about-emblem"><span className="pokeball-logo"><span /></span></div><span className="section-overline">SOBRE O PROJETO</span><h2>Uma Pokédex feita para explorar.</h2><p>Este projeto foi desenvolvido em React + TypeScript e consome os dados públicos da PokéAPI. Você pode pesquisar espécies, filtrar por tipo e geração, ver atributos e evoluções, ouvir sons e salvar seus favoritos no navegador.</p><div className="about-points"><span><Check size={17} /> Pokédex Nacional</span><span><Check size={17} /> Dados reais da API</span><span><Check size={17} /> Favoritos salvos localmente</span></div><a href="https://pokeapi.co/" target="_blank" rel="noreferrer">Conhecer a PokéAPI <ExternalLink size={15} /></a></section></div>}
    </div>
  );
}

export default App;
