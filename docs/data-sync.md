# Persistência, backup e offline

## Fonte primária

O Runas DM é local-first. IndexedDB guarda fichas, encontro, tabelas customizadas, versão e data da alteração. Isso mantém a mesa utilizável sem conexão e evita latência.

## Backup remoto

O D1 armazena um snapshot JSON privado. O endpoint exige:

1. Cloudflare Access protegendo toda a aplicação;
2. `RUNAS_DM_BACKUP_TOKEN` como secret do Worker;
3. `Authorization: Bearer <token>`.

O token fica somente em `sessionStorage`; não entra no bundle, IndexedDB ou Git.

Antes de publicar, aplique `apps/runas-dm/drizzle/0000_backup_snapshots.sql` ao D1. A configuração versionada do Pages usa o binding `DB`; nunca duplique esse binding no artefato gerado pelo Vinext.

## Conflitos

O snapshot possui `updatedAt`. A sincronização informa a data remota e pede confirmação antes de mesclar as fichas. A identidade de uma ficha é composta por nome, raça e elemento, comparados sem diferença de caixa e ignorando espaços excedentes.

- Ao criar o backup, a ficha local substitui a remota com a mesma identidade; fichas exclusivas dos dois lados continuam no snapshot.
- Ao sincronizar, a ficha remota substitui a local com a mesma identidade; fichas exclusivas dos dois lados continuam no navegador.
- A sincronização preserva o identificador local da ficha substituída para não quebrar cópias já anexadas à mesa.

## PWA

Runas Tools e Runas DM possuem manifesto, ícones e service worker. O service worker armazena o shell e assets versionados; os dados continuam no IndexedDB. O backup falha de forma não bloqueante sem rede. Regras completas em `docs/offline-pwa.md`.
