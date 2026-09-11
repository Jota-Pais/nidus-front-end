# Componentes do Nidus

Biblioteca própria do projeto, sobre o Ant Design. Um import por tela:

```tsx
import { CabecalhoDaTela, Pilha, Secao, Tabela } from '@/componentes'
```

## Por que existe

Uma tela nova não deveria precisar decidir de novo o que já foi decidido: como
se escreve data, como se marca estado de caixa, que altura tem um controle,
como se converte `Dayjs` para `aaaa-mm-dd`. Cada tela decidindo por conta é
como as três visões da colônia começam a discordar entre si.

Então a regra de entrada é: **componente usado por mais de uma tela, ou que
carrega uma decisão que não pode variar de tela para tela.** Componente de uma
tela só mora ao lado da tela — é o caso do `CardDaPosicao`, em
`telas/estantes/`.

## Onde ficam as decisões

| Decisão | Arquivo | Vale porque |
|---|---|---|
| Cor, fonte, raio, sombra, movimento | `app/tokens.ts` + `app/tokens.css` | Design system |
| Tema do Ant Design | `app/tema.ts`, derivado dos tokens | — |
| Formato de data e idade | `lib/data.ts` | `RNF-04` |
| Marcador, sigla e rótulo de estado | `dominio/estados.ts` | `RNF-10` |
| Forma dos dados da API | `dominio/*.ts`, do `docs/contrato-api.md` | Contrato |

⚠️ **Nenhum componente escreve cor, raio, sombra ou fonte literal.** Se o valor
não está em `tokens.ts`, ele não é do design system. `tokens.test.ts` falha se
o TypeScript e o CSS discordarem.

Transparência sai de `color-mix(in srgb, var(--token) 30%, transparent)`, nunca
de um `rgba()` escrito à mão — `rgba()` é uma cópia da cor que não acompanha
quando o token muda.

## Paleta

A paleta é a **institucional da UFSC**. Verde e azul são as principais;
vermelho, amarelo e preto são apoio — entram para dizer erro, atenção e
contorno, nunca para decorar.

| Cor | Hex | Pantone | Papel |
|---|---|---|---|
| **Verde Bandeira** | `#009206` | 355 C | **Principal** — identidade, marca, sucesso |
| **Azul Médio** | `#003893` | 2728 C | **Principal** — ação: botão, link, foco, seleção |
| Vermelho Tomate | `#FF0009` | 1788 C | Apoio — erro e previsão vencida |
| Amarelo | `#FEE300` | Yellow C | Apoio — atenção |
| Preto | `#000000` | Black C | Apoio — texto e contorno |

### ⚠️ A paleta do manual é de vinil adesivo, não de tela

Três das cinco cores **não alcançam** o contraste de 4.5:1 que o `RNF-10` exige
para texto. Medido pela fórmula da WCAG 2.1, sobre o fundo da aplicação:

| Cor | Como texto | Com branco por cima |
|---|---|---|
| Azul Médio | **10.13** ✅ | **10.57** ✅ |
| Preto | **20.12** ✅ | — |
| Verde Bandeira | 3.93 ❌ | 4.11 ❌ |
| Vermelho Tomate | 3.83 ❌ | 4.00 ❌ |
| Amarelo | 1.24 ❌ | 1.30 ❌ |

Daí a regra, e ela não é negociável:

- **O hex do manual vale onde não há texto pequeno** — preenchimento, marca,
  barra, ícone grande, título grande. Aí o piso é 3:1 e a cor institucional
  passa.
- **Onde há texto, entra a variante escurecida** — a mesma cor com menos luz,
  já em `tokens.ts`. Ninguém percebe a diferença de tom; todo mundo percebe a
  diferença de leitura.

| Uso | Token | Contraste |
|---|---|---|
| Verde em texto e ícone pequeno | `COR.institucionalTexto` `#00700A` | 6.06 |
| Vermelho em texto | `COR_DE_RETORNO.erro` `#CC0007` | 5.63 |
| Amarelo em texto | `COR_DE_RETORNO.aviso` `#6F6300` | 5.81 |

`tokens.test.ts` calcula esses números a cada rodada. Cor nova que não passe
em AA derruba a suíte — é assim que o `RNF-10` deixa de ser intenção.

### Por que o azul carrega a ação

É o único institucional que passa em AA **como texto e como fundo de botão**,
sem variante. Ação é o lugar onde não dá para negociar contraste, então ela
fica com a cor que não precisa de concessão. O verde carrega identidade, que
tolera o piso de 3:1.

### Os dois gradientes

| Gradiente | Cores | Onde |
|---|---|---|
| `--gradiente-marca` | verde → azul | Superfície **sem texto pequeno**: `IconeEmCaixa`, borda do `Cartao` destacado, `TextoGradiente` em título |
| `--gradiente-acento` | azul → azul claro | Botão primário — branco legível nas duas pontas |

São dois porque os usos são diferentes: um só obrigaria a escolher entre
identidade e legibilidade. **Nunca usar `marca` em botão** — a ponta verde
entrega 4.11:1 com texto branco, e o teste cobra isso.

### Estado da caixa

As cinco superfícies saem das cinco cores da UFSC em versão muito clara —
verde para a que reproduz, amarelo para a parcialmente comprometida, âmbar
para a totalmente, azul para a preparada, neutro para a expedida. A ordem das
cores acompanha a ordem das colunas, então o quadro tem progressão visual.

Claras de propósito: o acento é azul saturado e escuro, e um estado pintado com
a mesma força disputaria o olho com o botão — o usuário clicaria na caixa
achando que é comando.

## Anatomia de uma pasta

```
NomeDoComponente/
  index.tsx        o componente
  estilos.css      quando precisa de CSS próprio
  <assunto>.ts     função pura, quando houver (mascara.ts, valor.ts)
  index.test.tsx   quando o componente carrega requisito
```

Função pura fica **fora** do `index.tsx`: arquivo que exporta componente e
função solta quebra o hot reload (`react-refresh/only-export-components`), e
função sem JSX se testa sem montar nada.

## O catálogo

### Fundação do design system

| Componente | Para quê |
|---|---|
| `Botao` | 4 variantes. `primario` leva o gradiente de ação — **um por tela** |
| `Cartao` | Superfície elevada. `destacado` tem a borda de gradiente |
| `Secao` | `Cartao` com cabeçalho, rótulo e ações |
| `SecaoInvertida` | Faixa escura com textura. Holofote — **uma por tela** |
| `RotuloDeSecao` | A pílula monoespaçada que abre a seção |
| `TextoGradiente` | Realce de **uma** palavra no título |
| `IconeEmCaixa` | Ícone em quadrado com o gradiente da marca |
| `PontoPulsante` | Indicador de "isto está vivo" |
| `Revelar` | Entrada suave no scroll, sem dependência nova |
| `Pilha` | Empilhamento vertical com o espaçamento padrão |

### Casca e estrutura

| Componente | Para quê |
|---|---|
| `CabecalhoDaTela` | Rótulo, título, descrição e ações |
| `BarraDeFiltros` + `CampoDeFiltro` | Faixa de filtros, com rótulo associado de verdade |
| `Tabela` | `Table` com rolagem, contagem em português e `rowKey` obrigatório |
| `ListaDeDefinicoes` | Par rótulo/valor da ficha |
| `LinhaDoTempo` | Trilha de auditoria (`RNF-06`) |
| `ModalDeFormulario` | Modal + `Form`, com `erro.campos` indo para o campo certo |
| `BotaoDeConfirmacao` | Ação sem desfazer |
| `MensagemDeErro` | 409 sai como aviso, rede sai como aviso, o resto como erro |
| `PainelDeIndicadores` | Fila de números. `invertido` usa a faixa escura |
| `Vazio` | Distingue "nada cadastrado" de "filtro não achou" |

### Campos

| Componente | Para quê |
|---|---|
| `CampoDeData` | `DatePicker` que fala `DataISO`, não `Dayjs` (`RNF-04`) |
| `CampoDePeriodo` | Janela de datas (`RF-CIC-05`) |
| `CampoPorSexo` | Par M/F. `null` é branco, não zero |
| `CampoDeProjetoEtica` | Máscara posicional do Anexo A.4 |
| `SeletorDeEspecie` | `RF-CIC-01` — qual quadro, não filtro |
| `SeletorDeLinhagem` | Sempre dentro de uma espécie |
| `SeletorDeSala`, `SeletorDeEstante` | Infraestrutura |
| `SeletorDeParGenetico` | Os 5 pares do `RN-02` |

### Exibição de domínio

| Componente | Para quê |
|---|---|
| `Data` | `dd/mm/aaaa` em `<time>` |
| `DataPrevistaOuReal` | **`RF-REP-02`** — "vai nascer" × "nasceu" |
| `Idade` | Dias inteiros, com a base dita (`CONF-01` aberto) |
| `QuantidadePorSexo` | `4 M · 6 F`. **Nunca soma** (`RN-09`) |
| `Endereco` | `E-03 · Sala 1 · frontal · A1` |
| `IndicadorDeCiclo` | `RF-CIC-04`, com aviso no último ciclo |
| `MarcaDeAtraso` | **`RF-REP-07`** — o único componente que pode gritar |
| `ProximoEvento` | Tipo, data e atraso |
| `TagDeEspecie`, `TagDeFinalidade`, `TagDePerfil` | Vocabulário do glossário |

### Quadro de comprometimento

| Componente | Para quê |
|---|---|
| `CardDaCaixa` | O card das colunas |
| `ColunaDoQuadro` | Uma das 5. Aparece **mesmo vazia** |
| `BotaoDeMoverEstado` | `RF-CIC-03` — "mover para", em vez de arrastar |
| `DialogoDeExcecao` | O 409 `TRANSICAO_CONTRARIA_COMPROMISSO` |

## Regras que os componentes carregam

- **`RNF-01` — nada é calculado aqui.** Todo número exibido vem do servidor.
  `QuantidadePorSexo` não soma, `Idade` não conta, `PainelDeIndicadores` não
  agrega.
- **`RNF-10` — nada só por cor.** Todo estado leva marcador, sigla ou texto
  junto. `CardDaCaixa` tem teste que checa os cinco estados sem cor.
- **`RNF-03` — 48px de alvo de toque.** Vem do tema, não de cada componente.
  Não sobrescrever com `size="small"` em tela de registro.
- **`RNF-04` — data só por `Data`, `DataPrevistaOuReal` e `CampoDeData`.**
  Nenhuma tela chama `formatarData` na mão.
- **`RF-ACS-02` — esconder botão é conveniência.** Nada aqui autoriza nada.

## Movimento

Sem biblioteca de animação: `IntersectionObserver` mais CSS. A decisão de
stack está fechada em `docs/decisoes-de-stack.md` — entrar com dependência
nova é conversa com a equipe.

Toda animação contínua morre em `prefers-reduced-motion`, pela regra global em
`tokens.css`. Movimento perpétuo numa tela aberta o turno inteiro é gatilho de
enjoo para quem tem sensibilidade vestibular.

## Pontos em aberto

- `Catalogo` (em `dominio/useCatalogo.ts`) não tem `salas`, `modelosEstante` e
  divergindo do `contrato-api.md` §4 em `linhagens` e `paresGeneticos`.
  `SeletorDeSala` usa o Anexo A enquanto isso e aceita `salas` por
  propriedade. Fechar exige mudar o contrato **nos dois repositórios**.
- `Idade` pede a base porque `CONF-01` não fechou: nascimento ou desmame são
  22 dias de diferença.
