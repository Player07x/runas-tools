# Regras de produto

## Princípios

O Runas DM reduz o tempo gasto pelo mestre procurando fichas, calculando testes e transferindo dano. As palavras-chave são **simplicidade** e **velocidade**.

## Bestiário

- A galeria sempre exibe a ficha simplificada.
- Criar ou editar abre um modal, sem abandonar a tela atual.
- O modal inicia na ficha simplificada e permite alternar para a ficha avançada.
- O modo avançado preserva o modelo completo e versionado do Runas Tools.
- Simplificada e avançada são duas visualizações do mesmo objeto `Character`; nunca existem duas cópias da ficha dentro do editor.
- Perícias, habilidades, magias e itens exibidos na simplificada são os próprios registros estruturados das coleções da ficha completa, identificados por `id`. É proibido convertê-los em listas de texto ou manter cópias desnormalizadas.
- Toda alteração feita em um registro na simplificada deve aparecer imediatamente na avançada, e vice-versa.
- A simplificada pode omitir campos por velocidade. A avançada deve expor todos os campos de domínio editáveis do modelo completo.
- A importação aceita o envelope `{ version, character }` do Runas Tools sem perder os vínculos entre entidades.
- Não existe limite artificial para fichas.
- Tabelas customizadas de Melhoria de Maestria são configuração do sistema, não da ficha.
- Essências geradas usam `essências totais / 10`, arredondadas para baixo.
- Características listam apenas habilidades `Racial`.
- Ações agregam itens equipados, habilidades não raciais e magias no formato `nome categoria`.

## Mesa de encontro

- Anexar uma ficha cria cópia independente; mudanças de recursos não alteram o bestiário.
- A mesma ficha pode gerar quantas cópias forem necessárias.
- Duplicar uma criatura duplica seu estado atual.
- O alvo selecionado abre testes e dano em painel lateral na mesma página.

## Ações rápidas

- `Modificador` abre um campo compacto.
- Inteiros (`+3`, `-2`, `3`) somam ou subtraem do resultado final.
- Valores iniciados por `x` multiplicam. `x0,5` equivale a dividir por dois.
- `Avançado` abre configurações completas no mesmo painel.
- Dano percorre PA Extra, PA e PV, considerando redução, resistência e fraqueza.

## Privacidade e custo

- O projeto é particular e não possui cadastro público.
- A hospedagem deve usar Cloudflare Access e token de backup.
- Os componentes escolhidos possuem camada gratuita compatível com uso particular.
