# Arquitetura

## Visão geral

```text
apps/runas-tools ─┐
                  ├── packages/runas-core
apps/runas-dm ────┘
       │
       ├── IndexedDB (fonte local e offline)
       └── API privada → Cloudflare D1 (snapshot de backup)
```

## `@runas/core`

Contém tipos versionados, tabelas de consulta, cálculos derivados, rolagens, dano, melhoria de maestria e modificador rápido.

O núcleo não importa React, navegador, IndexedDB, Next.js, Cloudflare ou componentes. Seus módulos são publicados por subpaths, como `@runas/core/lib/damageCalculator`.

## Runas Tools

- Next.js com `output: "export"`.
- Independente de backend e com PWA.
- Consome e transpila o núcleo pelo workspace.
- O GitHub Pages publica somente `apps/runas-tools/out`.

## Runas DM

O editor mantém uma única instância de `Character` por ficha aberta. As telas Simplificada e Avançada são projeções de interface sobre essa mesma instância. Coleções de domínio (`skills`, `abilities`, `spells`, `inventory`, `bonds` e `notes`) continuam normalizadas em objetos com `id`; a interface compacta nunca cria campos alternativos de texto.

- Vinext/React hospedável em Cloudflare.
- Interface client-side para resposta imediata.
- IndexedDB salva bestiário, encontro e tabelas customizadas.
- `/api/backup` guarda snapshot privado no D1.
- O banco remoto não participa dos cálculos nem bloqueia o uso offline.

## Política para mudanças

1. Regra ou tabela comum deve ser alterada em `@runas/core`.
2. Adicione teste determinístico no núcleo.
3. Atualize interfaces somente para consumir o contrato.
4. Execute typecheck, testes, lint e build.
5. Ao mudar `Character`, aumente `CHARACTER_VERSION` e implemente migração.
