# Pokédex Explorer

Pokédex responsiva feita com **React, TypeScript, Vite e CSS** usando dados reais da [PokéAPI](https://pokeapi.co/).

## Rodar no computador

```bash
npm install
npm run dev
```

Abra o endereço exibido no terminal https://yagoprestes.github.io/POked-x-pro-MAX/

## Recursos

- Pokédex Nacional com lista dinâmica das espécies disponíveis na API.
- Busca por nome e por número.
- Filtro por geração e por um dos 18 tipos.
- Ordenação por número ou nome.
- Cards com artes oficiais e cores dos tipos.
- Detalhes com altura, peso, habilidades, estatísticas e descrição.
- Linha evolutiva interativa e fraquezas calculadas pela combinação dos tipos.
- Áudio do Pokémon, quando disponível na API.
- Favoritos salvos em `localStorage`.
- Carregamento incremental, tratamento de erros e layout para celular.

## Organização

- `src/App.tsx`: telas e componentes React.
- `src/App.css`: estilos.
- `src/index.css`: regras globais.
- `src/api.ts`: chamadas à PokéAPI, cache e processamento dos dados.
- `src/constants.ts`: traduções, cores, gerações e imagens.
- `src/types.ts`: interfaces TypeScript, sem `any` implícito.

As imagens dos Pokémon são carregadas do repositório público de sprites da PokéAPI no GitHub. É necessário ter conexão com a internet.

## Construir a versão de produção

```bash
npm run build
npm run preview
```

Este é um projeto de fãs, não afiliado à Nintendo, Game Freak ou The Pokémon Company. Pokémon e suas imagens pertencem a seus respectivos titulares.
