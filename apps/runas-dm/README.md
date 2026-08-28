# Runas DM

Bestiário particular e mesa rápida do sistema Runas.

## Execução local

Na raiz da suíte:

```bash
npm install
npm run dev:dm
```

O estado principal é salvo no IndexedDB do navegador. Exportar JSON continua disponível mesmo sem backend.

## Instalação offline

A opção `Instalar Runas DM` aparece somente no Bestiário. Depois que a tela indicar `Offline pronto`, fichas, mesa, testes e dano funcionam sem conexão. Backup e sincronização permanecem operações online e nunca são armazenados pelo service worker.

Consulte `../../docs/offline-pwa.md` para as regras de cache e validação.

## Backup D1

1. Use a base Cloudflare D1 `runas-dm-backups` e o binding `DB` de `wrangler.jsonc`.
2. Aplique `drizzle/0000_backup_snapshots.sql`.
3. Copie `.dev.vars.example` para `.dev.vars` somente no ambiente local e defina um token forte.
4. Em produção, cadastre `RUNAS_DM_BACKUP_TOKEN` como secret do Worker.
5. Proteja o site inteiro com Cloudflare Access antes de compartilhar o link.

O navegador pede o token uma vez por sessão por meio de um campo compatível com o gerenciador de senhas. O aplicativo mantém o segredo apenas em `sessionStorage`; quando o usuário aceita salvá-lo, a persistência e o autopreenchimento ficam sob proteção do navegador. `Backup` combina as fichas locais com as já armazenadas e faz a versão local vencer conflitos por nome, raça e elemento. `Sincronizar` faz a versão remota vencer os mesmos conflitos sem apagar fichas que existem somente no navegador. Consulte `../../docs/deployment.md` para publicação, segredo e acesso privado.

## Cloudflare Pages

O endereço canônico de produção é `https://runas-dm.pages.dev`.

```bash
npm run build:pages
npm run deploy:pages
```

`scripts/prepare-pages.mjs` transforma o build modular do Vinext no Advanced Mode do Pages sem copiar a configuração placeholder do ambiente local. O workflow `../../.github/workflows/deploy-runas-dm.yml` repete esse processo automaticamente no GitHub.

## Decisões importantes

As regras compartilhadas não ficam neste aplicativo. Consulte a raiz `AGENTS.md` e `docs/` antes de alterar cálculos ou formatos de ficha.

- Simplificada e Avançada editam a mesma instância completa de `Character`.
- Imagens são reduzidas localmente, salvas dentro da ficha e funcionam offline.
- O inventário simplificado mantém o resumo compacto e abre a edição do equipamento sob demanda.
- A Mesa oferece rolagem de dano e teste por equipamento, conjuração, gasto de Determinação/Casualidade e simulação editável antes de aplicar dano.
- Resistências e fraquezas herdadas do elemento vêm de `@runas/core/data/elements` e são combinadas com entradas personalizadas.
