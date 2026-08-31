import { BookOpen, ChevronDown } from "lucide-react"

const ruleSections = [
  {
    title: "1. Monte seu conjunto de jogo",
    content: (
      <>
        <p>Escolha um dos dois modos:</p>
        <ul>
          <li><strong>Modo padrão:</strong> 60 cartas no total.</li>
          <li><strong>Modo rápido:</strong> 40 cartas no total.</li>
        </ul>
        <p>Suas cartas são separadas em um <strong>baralho de Tropas</strong> e um <strong>baralho de Magias</strong>. Você decide quantas cartas colocar em cada um, desde que a soma respeite o total do modo.</p>
        <p>Escolha também <strong>um único Aventureiro</strong>. Ele não entra nos baralhos: começa a partida em campo e representa sua vida no jogo.</p>
      </>
    ),
  },
  {
    title: "2. Respeite raridades e equipamentos",
    content: (
      <>
        <p>A raridade determina quantas cópias de uma mesma carta podem estar no seu conjunto:</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {["Comum · 6", "Incomum · 5", "Raro · 4", "Épico · 3", "Místico · 2", "Lendário · 1"].map((item) => <span key={item} className="rounded-lg border border-border bg-background/70 px-2.5 py-2 text-xs font-semibold">{item}</span>)}
        </div>
        <p>Você pode incluir <strong>um Equipamento para cada 10 cartas</strong>: até 6 no modo padrão ou 4 no modo rápido. Antes da partida, deixe os Equipamentos separados. Sem olhar suas identidades, o oponente escolhe quantos irão para o baralho de Tropas e quantos irão para o de Magias. Em seguida, embaralhe novamente os dois baralhos.</p>
      </>
    ),
  },
  {
    title: "3. Prepare a partida",
    content: (
      <>
        <ol>
          <li>Coloque seu Aventureiro em campo.</li>
          <li>Posicione separadamente os baralhos de Tropas e de Magias.</li>
          <li>Na primeira rodada, os dois jogadores compram ao mesmo tempo uma mão inicial de <strong>6 cartas</strong>. Cada jogador decide de qual dos dois baralhos comprar cada carta.</li>
          <li>Comece com a energia indicada pelas regras do modo ou por efeitos aplicáveis. A energia acumulada nunca pode ultrapassar <strong>10</strong>.</li>
        </ol>
      </>
    ),
  },
  {
    title: "4. Começo do turno",
    content: (
      <>
        <p>No começo de cada um dos seus turnos, resolva esta sequência:</p>
        <ol>
          <li>Ganhe energia igual ao <strong>Ganho de Energia</strong> do seu Aventureiro, sem ultrapassar 10.</li>
          <li>Compre <strong>uma carta</strong>, escolhendo o baralho de Tropas ou o baralho de Magias.</li>
          <li>Receba suas <strong>3 ações</strong> para o turno.</li>
        </ol>
        <p>A compra normal do turno começa depois da rodada inicial, pois nela os dois jogadores já compram as 6 cartas ao mesmo tempo.</p>
      </>
    ),
  },
  {
    title: "5. Use ações e energia",
    content: (
      <>
        <p>Você possui 3 ações por turno. Cada uma pode ser usada para:</p>
        <ul>
          <li><strong>Atacar;</strong></li>
          <li><strong>Conjurar uma carta;</strong></li>
          <li><strong>Usar uma habilidade Ativa;</strong></li>
          <li>ou gastar <strong>as 3 ações de uma vez</strong> para receber novamente a energia gerada por seu Aventureiro.</li>
        </ul>
        <p>Para conjurar uma Tropa ou Magia, desconte o custo da sua energia acumulada e coloque a carta em campo. Você não pode conjurar uma carta se não puder pagar todo o custo.</p>
      </>
    ),
  },
  {
    title: "6. Observe o momento de cada carta",
    content: (
      <>
        <ul>
          <li><strong>Tropas, Feitiços e Rituais</strong> só podem ser jogados no seu turno.</li>
          <li><strong>Magias Rápidas e Auras</strong> também podem ser conjuradas durante o turno do oponente, desde que você possa pagar o custo.</li>
        </ul>
      </>
    ),
  },
  {
    title: "7. Ataque e combate",
    content: (
      <>
        <p>Gaste uma ação para declarar um ataque contra <strong>um único alvo</strong>. Durante essa rodada de combate, você pode virar para baixo quantas Tropas e/ou seu Aventureiro quiser para que participem do ataque.</p>
        <p>Enquanto o oponente possuir Tropas em campo, o Aventureiro dele não pode ser escolhido como alvo. A presença de Tropas aliadas não impede que o seu próprio Aventureiro ataque.</p>
      </>
    ),
  },
  {
    title: "8. Vida, descarte e equipamentos em campo",
    content: (
      <>
        <p>Quando uma Tropa ou Aventureiro chega a <strong>0 ou menos de Vida</strong>, a carta vai para o cemitério. Magias também vão para o cemitério quando seu efeito termina.</p>
        <p>Seu Aventureiro pode manter até <strong>dois Equipamentos</strong> ao mesmo tempo. Para equipar um terceiro, você pode sacrificar um dos Equipamentos que já estão em campo.</p>
      </>
    ),
  },
  {
    title: "9. Como vencer",
    content: <p>A partida termina imediatamente quando o Aventureiro de um jogador chega a <strong>0 ou menos de Vida</strong>. O outro jogador vence.</p>,
  },
]

export function GameRules() {
  return (
    <section className="mt-10 rounded-3xl border border-border bg-card p-5 shadow-[0_12px_36px_rgba(30,36,55,0.07)] sm:p-7" aria-labelledby="runic-rules-title">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-purple-soft text-purple-foreground"><BookOpen className="size-5" /></span>
        <div>
          <h2 id="runic-rules-title" className="text-xl font-bold tracking-tight">Regras de ORDEM × CAOS: RÚNICA</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Uma versão organizada para a primeira partida. Abra as etapas na ordem e mantenha esta referência ao lado da mesa.</p>
        </div>
      </div>
      <div className="mt-6 space-y-2">
        {ruleSections.map((section, index) => (
          <details key={section.title} open={index === 0} className="group rounded-2xl border border-border/80 bg-background/55">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-bold text-foreground marker:content-none">
              {section.title}
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="runic-rules-copy border-t border-border/70 px-4 py-4 text-sm leading-relaxed text-muted-foreground">{section.content}</div>
          </details>
        ))}
      </div>
    </section>
  )
}
