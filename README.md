# Runas Suite

Monorepo das ferramentas do sistema Runas. Ele mantém duas experiências separadas sobre o mesmo conjunto de regras de negócio.

## Projetos

- `apps/runas-tools`: calculadoras e ficha completa existentes. Continua sendo exportado como site estático e PWA.
- `apps/runas-dm`: bestiário particular e mesa rápida para o mestre, com fichas simplificadas, testes e dano integrados.
- `packages/runas-core`: tipos, cálculos e tabelas compartilhadas pelos dois aplicativos.

## Desenvolvimento

```bash
npm install
npm run dev:tools
npm run dev:dm
```

Validação completa:

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

O Runas Tools é gerado em `apps/runas-tools/out`. O Runas DM usa Vinext/Cloudflare e inclui uma base D1 somente para backup privado.

Leia `AGENTS.md` e os arquivos em `docs/` antes de alterar o projeto.

Documentos operacionais:

- `docs/offline-pwa.md`: instalação, cache e validação offline;
- `docs/deployment.md`: GitHub Pages, Worker, D1, segredos e acesso privado.
