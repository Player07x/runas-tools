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

Contém tipos versionados, tabelas de consulta, cálculos derivados, sincronização de invariantes, rolagens, dano, melhoria de maestria e modificador rápido.

O núcleo não importa React, navegador, IndexedDB, Next.js, Cloudflare ou componentes. Seus módulos são publicados por subpaths, como `@runas/core/lib/damageCalculator`.

## Runas Tools

- Next.js com `output: "export"`.
- Independente de backend e com PWA.
- Consome e transpila o núcleo pelo workspace.
- O GitHub Pages publica somente `apps/runas-tools/out`.

## Runas DM

O editor mantém uma única instância de `Character` por ficha aberta. As telas Simplificada e Avançada são projeções de interface sobre essa mesma instância. Coleções de domínio (`skills`, `abilities`, `spells`, `inventory`, `bonds` e `notes`) continuam normalizadas em objetos com `id`; a interface compacta nunca cria campos alternativos de texto.

Toda edição passa por `synchronizeCharacterDerivedValues`. A função recalcula informações derivadas, carga, defesa e limites de recursos; combina resistências/fraquezas do elemento com as personalizadas; permite PV atual negativo; e limita PA/PE aos respectivos máximos. O teto de PE Temporário é o PE atual. Runas Tools e Runas DM consomem essa mesma função.

`Character.portraitDataUrl` é opcional e versionado desde a versão 18. O Runas DM reduz o arquivo a JPEG 512×512 antes de persistir, permitindo uso offline e sincronização pelo snapshot sem armazenar a imagem original.

Na Mesa, cada ator é uma cópia independente. Testes podem gastar Determinação ou Casualidade; itens vinculam sua perícia por `skillId`; magias usam `castingSkill`; e a aplicação de dano mantém as três camadas PA Extra → PA → PV, seus elementos, multiplicadores, quebra, RDF/RDM e MT. Toda rolagem de dano, inclusive a iniciada por equipamento, cria primeiro uma simulação com valor final editável e só altera a ficha após confirmação explícita.

- Vinext/React publicado como Pages Function em `runas-dm.pages.dev`.
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
