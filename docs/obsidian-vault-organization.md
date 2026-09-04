# Organização do vault Ordem x Caos

## Estrutura padronizada

```text
Ordem x Caos/
├── Cronologia/
│   ├── Acontecimentos Globais/
│   └── Acontecimentos Regionais/
├── Geografia/
│   ├── Assentamentos/
│   ├── Continentes/
│   ├── Mundos/
│   ├── Regiões/
│   └── Territórios/
├── Personagens/
│   ├── Divindades/
│   └── Runilitas/
├── Fauna/
├── Monstros/
├── Itens/
├── Assets/
└── Bases/
```

As seis primeiras pastas são as seções da Wiki. Uma subpasta representa uma categoria e não pode conter outra subpasta. Uma página pode pertencer a várias categorias: sua primeira categoria define a subpasta física e as demais são registradas no campo `categorias` do frontmatter.

`Assets` guarda imagens e demais anexos. `Bases` guarda arquivos `.base` do Obsidian e este documento. As áreas `Templates`, `Notas`, `Histórias` e `Campanhas` são particulares e não são importadas pela Wiki do Runas DM.

## Migração realizada

- `Cronologia Geral` foi renomeada para `Cronologia`, sem alterar os sete documentos existentes.
- `Geografia` foi preservada com 39 documentos e cinco categorias.
- `Personagens` foi preservada com 54 documentos e duas categorias.
- `Fauna`, `Monstros` e `Itens` foram criadas vazias para receber conteúdo futuro.
- `Assets`, `Bases`, `.obsidian` e todas as áreas excluídas foram preservadas.
- Nenhum documento foi sobrescrito ou excluído.

## Comportamento do Runas DM

Ao importar, o site deduz a seção pela pasta principal e adiciona a subpasta às categorias da página. Ao criar uma página, grava na pasta da seção e usa a primeira categoria como subpasta. Imagens `![[...]]` são procuradas em `Assets`, guardadas apenas no cache local do navegador e exibidas no editor com os mesmos controles de tamanho, alinhamento e fluxo de texto das imagens enviadas pelo site.
