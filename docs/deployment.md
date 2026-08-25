# Publicação da Runas Suite

## Topologia

```text
GitHub: Player07x/runas-tools (monorepo)
├── apps/runas-tools → GitHub Pages
├── apps/runas-dm    → Worker privado + D1
└── packages/runas-core → incorporado nos dois builds
```

Os dois aplicativos devem ser construídos a partir do mesmo commit. `@runas/core` não é publicado no npm e não é uma API remota: o workspace o incorpora em ambos os artefatos, preservando o modo offline.

## Runas Tools

`.github/workflows/deploy-pages.yml` instala a raiz do workspace, valida a suíte e publica somente `apps/runas-tools/out`. O repositório deve manter GitHub Pages com Source = GitHub Actions.

## Runas DM

O Runas DM usa um Worker compatível com Cloudflare, binding lógico D1 `DB` e a migração `apps/runas-dm/drizzle/0000_backup_snapshots.sql`.

Variáveis de produção:

- `RUNAS_DM_BACKUP_TOKEN`: segredo; nunca registrar no Git, logs ou arquivos `.env` versionados.

O acesso de produção deve permanecer `custom`, com o proprietário e somente os e-mails explicitamente autorizados. Alterar o modo para público é uma operação de segurança e exige autorização expressa.

## Ordem de uma publicação

1. `npm ci` na raiz.
2. Testes e typecheck de `@runas/core`.
3. Lint e build dos dois consumidores.
4. Publicar Runas Tools no GitHub Pages.
5. Gerar/aplicar migrações D1 antes de publicar código que dependa delas.
6. Publicar Runas DM com segredo e política de acesso já configurados.
7. Verificar as duas URLs e o modo offline.

Se uma publicação falhar, a versão anterior deve continuar ativa. Nunca publique um consumidor após falha nos testes do núcleo compartilhado.

## Preparação de novos dispositivos

O usuário abre o endereço autorizado, instala o aplicativo pela tela inicial e espera o indicador `Offline pronto`. Depois pode trabalhar sem rede; o botão Backup volta a funcionar quando a conexão retornar.
