# Requisitos — CPMR (Controle de Produção de Matrizes Reprodutoras)

**v0.2 · 27/08/2026 · Base para discussão**
Fonte: spec do cliente v2.4 + protótipo existente.

> Este documento descreve **o que** o sistema precisa fazer.
> Tecnologia, arquitetura, modelagem física e contrato de API **não fazem parte dele** — são decisão nossa e vão em documento separado.

**Legenda de prioridade:** `[M]` obrigatório · `[I]` importante · `[D]` desejável
**IDs:** `RF-` funcional · `RN-` regra de negócio · `RNF-` não funcional · `PEN-` pendência · `CONF-` conflito na spec do cliente

---

## 1. Contexto

O CPMR é um **biotério de produção**: cria roedores de linhagens controladas e fornece a pesquisadores da universidade mediante projeto aprovado pelo comitê de ética. Não é laboratório de experimentação — é operação de produção planejada com prazo biológico rígido.

**Problema central:** o pesquisador pede animais de uma linhagem, numa idade e numa data específicas. Do outro lado há uma colônia de estoque futuro parcialmente previsível — parte já nasceu, parte vai nascer em data estimada, parte depende de acasalamento que ainda não aconteceu.

Hoje isso é feito em planilha e memória da equipe. Três falhas recorrentes:

- **Promessa inviável** — aceita-se pedido cuja data não cabe no ciclo biológico
- **Alocação dupla** — a mesma ninhada é prometida a dois projetos
- **Produção cega** — acasala-se sem demanda, ou descobre-se tarde que faltou acasalar

**O que o sistema entrega:** fonte única sobre o estado da colônia + um motor que responde, dado um pedido: *dá para atender, com quais caixas, e se não dá, quantos acasalamentos faltam e até quando.*

---

## 2. Glossário

A equipe não conhece o vocabulário de biotério. Usar estes termos na interface e no código.

| Termo | Significado |
|---|---|
| **Matriz** | Fêmea reprodutora; por extensão, o plantel reprodutor |
| **Linhagem** | Variedade geneticamente definida (ratos: Wistar, SHR, Kyoto / camundongos: Swiss, C57BL/6J). Não são intercambiáveis |
| **Colônia** | Agrupamento produtivo dentro da espécie: *Piloto* e *Produção*, em paralelo (`PEN-04`) |
| **Slot / posição** | Endereço físico fixo na estante (sala, estante, face, linha, coluna). Não se move |
| **Caixa** | A gaiola que ocupa o slot. Unidade de manejo: casal, ninhada ou grupo de desmamados |
| **Casal** | Macho + fêmea alocados para reprodução, com identidade genética e vida útil limitada |
| **Acasalamento** | Data de formação/reagrupamento do casal. Marco zero de cada ciclo |
| **Parto** | Nascimento de uma ninhada. Até 5 por casal; cada um tem ficha própria |
| **Ninhada** | Conjunto de filhotes de um parto |
| **Eutanásia de seleção** | Redução deliberada da ninhada no dia do nascimento, para ajustar M/F ao que a mãe sustenta e ao protocolo. Prática padrão, precisa ser registrada |
| **Desmame** | Separação dos filhotes da mãe (~22d após o parto). A partir daí são estoque contável |
| **Plantel** | O que a colônia já tem ou já tem previsto — em oposição a acasalar do zero |
| **CEUA** | Comissão de Ética no Uso de Animais. Todo pedido nasce de projeto aprovado, com **cota** |
| **Remessa** | Uma entrega. Um pedido pode ter remessa única ou cronograma |
| **Quarentena** | Isolamento sanitário de caixa/estante/sala. Bloqueia movimentação e saída |

---

## 3. Escopo

**Dentro:** infraestrutura física e ocupação · casais, genética e ciclo reprodutivo · partos, seleção, desmame, mortalidade · acompanhamento visual da colônia · solicitação de animais · motor de viabilidade e sugestão · reserva, agrupamento e expedição · cotas de projeto de ética · insumos (ração e maravalha) · indicadores · auditoria.

**Fora:** procedimentos experimentais (o animal sai da tutela do CPMR) · tramitação de projetos na CEUA (só consultamos) · financeiro e compras · controle de acesso físico · telemetria ambiental · prontuário veterinário completo · genotipagem.

> Vários itens "fora" são candidatos naturais a fase 2 e o cliente provavelmente vai pedir. Deixar explicitamente fora agora, mas não impedir na modelagem.

---

## 4. Atores

| Perfil | Quem é | Pode |
|---|---|---|
| **Pesquisador** | Docente/pós com projeto de ética aprovado | Solicitar dentro da cota do projeto; acompanhar os próprios pedidos; ver saldo. **Não enxerga a colônia** |
| **Técnico** | Equipe de manejo | Operar a colônia (casais, parto, seleção, desmame, mortalidade, movimentação); rodar o motor; analisar solicitações e propor atendimento; insumos |
| **Gestor** | Responsável pelo CPMR | Tudo do técnico + aprovar/recusar solicitações, parametrizar, gerir usuários, indicadores e auditoria |

- **RF-ACS-01** `[M]` Autenticação pela identidade institucional. Sem senhas próprias para usuário final. Precisa de acesso administrativo independente, para não perder o sistema se o SSO cair (`PEN-09`)
- **RF-ACS-02** `[M]` Autorização e filtragem por perfil **decididas no servidor**. O cliente pode esconder um botão por conveniência, mas nunca autoriza
- **RF-ACS-03** `[I]` Um pesquisador pode ter vários projetos e um projeto vários pesquisadores. A escolha do projeto é obrigatória no pedido
- **RF-ACS-04** `[I]` Gestor pode delegar aprovação a técnico, por período, com registro em auditoria

---

## 5. Modelo conceitual

Entidades e cardinalidade — **não** tabelas.

| Entidade | Descrição | Relações |
|---|---|---|
| **Sala** | Ambiente com barreira sanitária própria | Contém estantes |
| **Estante** | Rack com fabricante, modelo e topologia (faces × linhas × colunas) | Pertence a uma sala; contém slots |
| **Slot** | Endereço físico imutável | No máximo uma caixa por vez |
| **Caixa** | Unidade de manejo com finalidade (reprodução, maternidade, recria, expedição) e estado | Ocupa um slot; abriga casal ou grupo |
| **Casal** | Par reprodutor com identidade genética, formação e ciclo de vida | Máx. 1 ativo por caixa; até 5 partos |
| **Parto** | Ficha de um ciclo: previsões, evento real, seleção, desmame, mortalidade | Do casal; ordem 1–5 |
| **Lote de animais** | Conjunto rastreado em bloco: espécie, linhagem, sexo, nascimento, quantidade | Origem num parto; destino numa remessa (`PEN-01`) |
| **Projeto de ética** | Número, vigência, responsável, cota | Do pesquisador; consome cota |
| **Solicitação** | Espécie, linhagem, quantidades por sexo, idade alvo, datas | De um projeto; desdobra em remessas |
| **Remessa** | Uma entrega numa data | Recebe compromissos de N caixas |
| **Compromisso** | Reserva de N machos e N fêmeas de um parto para uma remessa | **É o que impede alocação dupla** |
| **Movimento de insumo** | Entrada/baixa com lote e validade | Vinculado a evento operacional |
| **Evento** | Registro datado e assinado de qualquer fato relevante | Referencia qualquer entidade acima |

> ⚠️ **Decisão estrutural em aberto:** o sistema rastreia *animal individual*, *lote* ou só *caixa*? A spec oscila entre os três — fala em "animais" no pedido, conta tudo por caixa. É a decisão mais cara do projeto (`PEN-01`). O modelo acima assume **lote** como hipótese de trabalho.

---

## 6. Regras de negócio

### Ciclo biológico

**RN-01** `[M]` **Parâmetros configuráveis e versionados.** Os valores abaixo foram homologados pelo corpo técnico e valem hoje para as duas espécies. **Não são constantes de código:** parâmetros por espécie (futuramente por linhagem), editáveis pelo gestor, com histórico — cálculo feito no passado precisa continuar reproduzível.

| Parâmetro | Valor atual | Aplicação |
|---|---|---|
| Gestação | 23 dias | Acasalamento → parto previsto |
| Aleitamento | 22 dias | Parto → desmame previsto |
| Intervalo entre ciclos | 6 dias | Parto real → próximo acasalamento |
| Máx. partos por casal | 5 | Vida útil reprodutiva |
| Expectativa por parto | 4 M / 4 F | Estimativa de ninhada não nascida (`PEN-05`) |

### Genética

**RN-02** `[M]` **Cruzamento rotacional.** Cada reprodutor pertence a um grupo (A–E). Só valem os pares `AB, BC, CD, DE, EA` — a rotação em anel evita consanguinidade. Identidade do casal = dupla de grupos, primeiro caractere = grupo do macho. O sistema recusa casal fora da lista. **Lista configurável, não fixa no código.**

**RN-03** `[M]` Máximo **um casal ativo por caixa**. Casais encerrados ficam no histórico.

**RN-04** `[M]` **Vida útil:** após o 5º parto com data real confirmada, o casal encerra. O sistema sinaliza a aproximação para permitir planejar reposição (`PEN-03`).

### Cadeia temporal

**RN-05** `[M]` **Datas previstas são derivadas, nunca digitadas.** Só se informa manualmente o **primeiro acasalamento** e as **datas reais**. O resto é calculado:

- Parto previsto = acasalamento + gestação
- Desmame previsto = parto previsto + aleitamento
- Acasalamento do ciclo *n* (n≥2) = parto real do ciclo *n−1* + intervalo

Confirmar um parto real **recalcula toda a cadeia à frente**. O ciclo atual do casal = contagem de partos com data real confirmada.

**RN-06** `[M]` **Viabilidade de prazo (timeline reversa).** Pedido de idade *X* para data *T* só é viável via produção nova se:

```
T ≥ hoje + gestação + aleitamento + X
```

```
|--- gestação 23d ---|--- aleitamento 22d ---|--- recria X dias ---|
acasalamento        parto                 desmame              entrega
```

Para 21 dias de idade: mínimo de **66 dias**. Abaixo disso só se atende com plantel existente — ou não se atende.
⚠️ A base de contagem da idade está em conflito na spec: ver `CONF-01`.

### Tolerância de idade

**RN-07** `[M]` Pedido de idade *X* aceita *X ± variação*; a variação cresce com a idade. **Tabela é dado configurável, não código.**

| Faixa pedida (dias) | Variação | Exemplo |
|---|---|---|
| 21–22 | ± 1 | 21d aceita 20–22 |
| 23–25 | ± 2 | 24d aceita 22–26 |
| 26–30 | ± 3 | 28d aceita 25–31 |
| 31–40 | ± 4 | 35d aceita 31–39 |
| 41–50 | ± 5 | 45d aceita 40–50 |
| 51–60 | ± 7 | 55d aceita 48–62 |
| 61–90 | ± 10 | 75d aceita 65–85 |
| > 90 | ± 15 | 120d aceita 105–135 |

### Integridade da alocação

**RN-08** `[M]` **Grau de certeza da oferta.** Todo animal ofertado carrega classificação de confiança, que define prioridade e risco:

- **Confirmado** — já nasceu e já desmamou (contagem real)
- **Previsto** — já nasceu, desmame estimado (quantidade real, data estimada)
- **Projetado** — ainda não nasceu (quantidade e data estimadas)

**RN-09** `[M]` **Um animal, um compromisso.** A soma dos compromissos de um parto nunca excede sua disponibilidade. **É a invariante que o sistema existe para garantir.**

**RN-10** `[M]` **Reuso em cronograma.** Numa entrega fracionada, caixa já usada em remessa anterior só volta a ser elegível se a nova data coincidir com a viabilidade do **próximo ciclo** dela. Crias já comprometidas ficam de fora.

**RN-11** `[M]` **Produção nova é o último recurso.** Esgota-se o plantel antes de propor acasalamento — acasalar custa matriz, espaço e tempo.

**RN-12** `[M]` **Cota de ética é limite rígido.** Nenhuma aprovação além da cota disponível nem com projeto fora de vigência (`PEN-10` define o momento de consumo).

---

## 7. Infraestrutura física

Hoje: 3 salas, 2 espécies, 2 colônias por espécie, estantes de 2 fabricantes em 4 topologias.

- **RF-INF-01** `[M]` **Topologia parametrizável.** Modelos de estante não podem ser embutidos: cada modelo é cadastro (fabricante, nome, nº de faces, linhas, colunas, esquema de nomeação). Cadastrar modelo novo é operação de admin, não deploy. Os 4 modelos atuais (128, 50, 112, 40 posições, todos com face frontal e traseira) são **dados de carga inicial**
- **RF-INF-02** `[M]` Endereçamento único e legível no mundo físico, coerente com a etiqueta que a equipe usa na estante
- **RF-INF-03** `[M]` **Visão espacial da ocupação**, reproduzindo a estante real com as duas faces visíveis ao mesmo tempo. Comunica de relance: vazia, com casal, estágio do ciclo, situação de comprometimento. **A codificação não pode depender só de cor** — segundo canal (forma, marcador, texto) por acessibilidade e impressão P&B
- **RF-INF-04** `[M]` **Ficha da posição:** casal e linhagem, ciclo corrente e histórico de partos, composição atual de animais, histórico de eventos
- **RF-INF-05** `[I]` **Movimentação de caixa** como evento registrado (origem, destino, data, responsável). Recusa destino ocupado e saída de barreira sanitária sob quarentena
- **RF-INF-06** `[I]` Capacidade instalada / ocupada / livre por sala, estante e colônia — insumo direto para decidir se cabe acasalamento novo
- **RF-INF-07** `[D]` Etiqueta/cartão com identificador legível por máquina, para abrir a ficha pelo celular na frente da estante (`PEN-08`)

---

## 8. Gestão reprodutiva

Núcleo operacional. É onde o técnico passa o dia e de onde sai toda a previsão de oferta.

- **RF-REP-01** `[M]` **Formação de casal:** macho + fêmea numa caixa, com linhagem, grupos genéticos e data. Validado por `RN-02` e `RN-03`. A confirmação dispara a cadeia temporal
- **RF-REP-02** `[M]` **Ficha de ciclo reprodutivo:** até 5 fichas navegáveis por casal, cada uma com acasalamento, parto previsto/real, nascidos por sexo, eutanásia de seleção por sexo, remanescentes, desmame previsto/real, desmamados por sexo, mortalidade. **Datas previstas visualmente distintas das reais** — a diferença entre "vai nascer" e "nasceu" é a informação mais importante da tela
- **RF-REP-03** `[M]` **Registro de parto:** data real e nascidos por sexo. Confirma o ciclo, recalcula a cadeia (`RN-05`) e converte a oferta de *projetada* para *prevista*
- **RF-REP-04** `[M]` **Eutanásia de seleção:** no dia do nascimento, define quantos M/F permanecem. Sem limite imposto pelo sistema — o técnico decide pelo protocolo. Registra quantidade, data e responsável; recalcula disponibilidade
- **RF-REP-05** `[M]` **Desmame:** data real e quantidade efetiva por sexo, descontada mortalidade do aleitamento. Daqui em diante os animais são estoque *confirmado* e passam a ocupar caixa própria (`PEN-02`)
- **RF-REP-06** `[M]` **Mortalidade** de filhotes e adultos, com data, quantidade, sexo e motivo. Baixa de reprodutor encerra o casal e sinaliza reposição
- **RF-REP-07** `[M]` **Alertas do ciclo:** painel do técnico com o que vence hoje e nos próximos dias — partos previstos, desmames, reacasalamentos liberados, casais no último ciclo, e **previsões vencidas sem confirmação**. Esta última precisa gritar: é o principal ponto de erosão silenciosa da confiabilidade dos dados
- **RF-REP-08** `[I]` **Encerramento e reposição de casal**, registrando destino dos reprodutores e liberando a posição; apoio à escolha do par de reposição respeitando a rotação genética (`PEN-03`)
- **RF-REP-09** `[I]` **Correção de registro.** Data e contagem erradas acontecem. Toda correção guarda o valor anterior, autor e motivo, recalcula em cascata **e alerta sobre compromissos já assumidos que ficaram inconsistentes**
- **RF-REP-10** `[I]` **Quarentena** de caixa, estante ou sala. Enquanto ativa: bloqueia expedição, bloqueia saída da barreira, sinaliza compromissos afetados para renegociação (`PEN-06`)
- **RF-REP-11** `[I]` **Confirmação de gestação.** Marco entre o acasalamento e o parto: o técnico confirma que a fêmea está gestante. Eleva o grau de confiança da oferta *projetada* (`RN-08`) — antes disso, o parto previsto é só uma expectativa de acasalamento. A spec do cliente tem esse estado (*matriz grávida*) mas não descreve o evento que o produz: quem confirma, como e em que janela (`PEN-13`)

---

## 9. Ciclo de vida da caixa

Além do estado biológico, cada caixa tem estado de **comprometimento**, acompanhado num quadro segregado por espécie.

| Estado | Significado |
|---|---|
| Em reprodução | Casal ativo, nenhuma cria comprometida |
| Parcialmente comprometida | Parte da ninhada reservada; ainda há saldo ofertável |
| Totalmente comprometida | Toda a ninhada disponível está reservada |
| Preparada para envio | Animais separados e conferidos, aguardando expedição |
| Expedida | Entregues; saíram da tutela do CPMR |

- **RF-CIC-01** `[M]` Um quadro por espécie, sem mistura. Segregação **aplicada no servidor**, não por filtro de interface
- **RF-CIC-02** `[M]` Estado consistente entre visões: quadro e grade de estantes leem da mesma fonte e nunca divergem
- **RF-CIC-03** `[M]` **Transição livre, com consequência.** Move-se entre estados livremente, inclusive retrocedendo; cada transição registra autor, data, origem e destino. Transição que contraria compromisso exige confirmação explícita e fica registrada como exceção
- **RF-CIC-04** `[M]` **Ciclo reprodutivo visível no card** (1º a 5º) — muda a leitura de risco da oferta. Indicador com legenda, não só cor
- **RF-CIC-05** `[I]` Filtros por linhagem, sala, colônia, projeto comprometido e janela de datas previstas

> ⚠️ **Conflito estrutural:** a spec diz que o quadro só mostra caixas com casal ativo, mas os dois últimos estados tratam de animais já desmamados — que não estão mais com o casal. Ver `CONF-02` e `PEN-02`.

---

## 10. Demanda, solicitações e cotas

- **RF-DEM-01** `[M]` **Solicitação:** projeto de ética, espécie, linhagem, quantidade por sexo, idade desejada na entrega, data desejada, regime (remessa única ou cronograma semanal/quinzenal/mensal/datas avulsas)
- **RF-DEM-02** `[M]` **Validação no ato:** projeto vigente, cota suficiente, coerência linhagem×espécie, viabilidade de prazo (`RN-06`). Quando a data é inviável, o sistema **informa a data mais próxima possível** em vez de só recusar
- **RF-DEM-03** `[M]` **Fluxo de aprovação:** rascunho → enviada → em análise → aprovada/recusada/ajustada → em atendimento → concluída, com *cancelada* possível até a expedição. Toda mudança registra autor, data e justificativa em recusa ou ajuste (`PEN-11`)
- **RF-DEM-04** `[M]` **Contraproposta.** Técnico ou gestor responde com atendimento diferente do pedido (outra data, outra quantidade, fracionamento) e o pesquisador aceita ou recusa. **Muito pedido não é atendível como veio; sem isso o fluxo trava**
- **RF-DEM-05** `[M]` **Acompanhamento pelo solicitante:** estado, o que foi aprovado, datas de cada remessa, o que já foi entregue, saldo de cota
- **RF-DEM-06** `[M]` **Projeto de ética e cota:** número no formato institucional, vigência, responsável, cota autorizada. Controle de consumido/saldo e alerta abaixo de limiar configurável (hoje 20%). Granularidade e momento do consumo em `PEN-10`
- **RF-DEM-07** `[I]` **Notificações** nos marcos: recebido, aprovado, recusado, remessa confirmada, remessa em risco, entrega realizada, cota crítica, projeto perto do vencimento (`PEN-12`)
- **RF-DEM-08** `[I]` **Cancelamento** libera compromissos, devolve animais à oferta e recompõe a cota conforme `PEN-10`. Sempre com registro e notificação

---

## 11. Motor de atendimento

O diferencial do produto: dado um pedido, responde o que a colônia entrega, de onde, com qual confiança, e o que falta produzir.

- **RF-MOT-01** `[M]` **Varredura da oferta.** Dado espécie, linhagem, quantidades por sexo, idade alvo e data de entrega, percorre **todos os ciclos (1º ao 5º)** de todas as caixas elegíveis. A idade é calculada **na data de entrega**, não na data da consulta. Referência de data, em ordem: desmame real → desmame previsto → parto previsto + aleitamento
- **RF-MOT-02** `[M]` **Filtro por tolerância:** só entram grupos dentro da faixa aceita (`RN-07`). Segundo a spec, os estados elegíveis são *em reprodução*, *parcialmente comprometida* (com saldo) e *preparada para envio* — ficam de fora *totalmente comprometida* e *expedida*. Confirmar com o cliente por que uma caixa já preparada para envio continua ofertável (`PEN-14`)
- **RF-MOT-03** `[M]` **Desconto de compromissos:** a disponibilidade desconta o que já está prometido a outras remessas, consumindo primeiro o estoque de maior certeza. **O motor nunca oferece o que já foi prometido**
- **RF-MOT-04** `[M]` **Ordenação:** primeiro por grau de certeza (confirmado → previsto → projetado); dentro do grupo, por proximidade da idade alvo e maior disponibilidade (para concentrar em menos caixas). **Critérios configuráveis** — vão mudar quando a operação amadurecer
- **RF-MOT-05** `[M]` **Resposta do motor:**
  - caixas elegíveis com grau de certeza, idade na entrega, disponibilidade por sexo, estado e localização
  - a alocação sugerida, com quantidade por caixa
  - o déficit que o plantel não cobre
  - quantos acasalamentos novos cobririam o déficit, com datas de parto, desmame e entrega
  - se nem produção nova resolve, **a data mínima** em que o pedido passa a ser viável
- **RF-MOT-06** `[M]` **Ajuste manual.** A sugestão é ponto de partida, não decisão: o operador troca caixas, ajusta quantidades e remove itens; o sistema revalida e recalcula o déficit a cada mudança
- **RF-MOT-07** `[M]` **Cronograma:** roda por remessa, acumulando as caixas já usadas e aplicando `RN-10`. **Nenhum animal em duas remessas**
- **RF-MOT-08** `[M]` **Confirmação da alocação:** registra compromissos, atualiza estado das caixas, vincula à remessa e à solicitação, grava rastreabilidade origem→destino. **Operação atômica** — duas confirmações simultâneas sobre a mesma ninhada não podem ambas ter sucesso (`RN-09`)
- **RF-MOT-09** `[M]` **Simulação livre.** Rodar o motor sem pedido formal, para responder *"se me pedirem 40 Wistar de 30 dias em outubro, eu tenho?"* e planejar acasalamentos com antecedência. A mesma tela carrega os parâmetros de uma solicitação recebida e já executa a busca
- **RF-MOT-10** `[I]` **Replanejamento por frustração de previsão.** Quando a realidade fica abaixo do previsto (ninhada pequena, mortalidade, casal perdido), identifica os compromissos afetados, alerta os responsáveis e oferece nova varredura. **Sem isso o sistema promete e não avisa quando a promessa quebra** — exatamente a falha que ele existe para eliminar (`PEN-07`)
- **RF-MOT-11** `[D]` Sugestão proativa de quantos casais formar por linhagem e quando, a partir do histórico e dos pedidos recorrentes
- **RF-MOT-12** `[D]` Consulta em linguagem natural sobre os mesmos dados e regras. Camada **sobre** o motor, jamais caminho alternativo de decisão

---

## 12. Agrupamento e expedição

- **RF-EXP-01** `[M]` **Agrupamento:** consolidar animais de várias caixas numa caixa de expedição, **mantendo o vínculo com cada parto de origem**
- **RF-EXP-02** `[M]` **Regras de compatibilidade:** mesma espécie e linhagem, mesmo sexo quando exigido, diferença máxima de idade, limite de densidade por caixa conforme norma (`PEN-08`)
- **RF-EXP-03** `[M]` **Conferência e entrega:** data, quantidades efetivas por sexo, recebedor, responsável pela liberação. Divergência entre prometido e entregue é registrada e justificada, **nunca silenciosa**
- **RF-EXP-04** `[M]` **Rastreabilidade completa,** nos dois sentidos: de qualquer animal entregue reconstrói-se projeto → pesquisador → remessa → caixa de expedição → caixas de origem → parto → casal → linhagem → grupos genéticos
- **RF-EXP-05** `[I]` **Documento de entrega** (impresso ou arquivo) com projeto, composição do lote, origem e assinaturas — referência em auditoria de ética

---

## 13. Insumos

Ração e maravalha, mesma estrutura. Objetivo: consumo rastreável e reposição planejada, não almoxarifado completo.

- **RF-INS-01** `[M]` Entrada com lote, fornecedor, nota fiscal, quantidade, recebimento e validade
- **RF-INS-02** `[M]` Baixa manual e baixa automática vinculada a evento (troca de caixa, confirmação de entrega). Gatilhos e fórmula de consumo em `PEN-08`
- **RF-INS-03** `[M]` Saldo por insumo e por lote, alerta de estoque abaixo do ponto de reposição e de lote perto do vencimento. Consumo por ordem de validade
- **RF-INS-04** `[D]` Projeção de consumo a partir da população projetada, para dimensionar compras

---

## 14. Indicadores e auditoria

- **RF-BI-01** `[I]` **Indicadores reprodutivos** por espécie, linhagem, colônia e período: tamanho médio de ninhada, intervalo real × previsto entre partos, taxa de desmame, mortalidade pré e pós-desmame, produtividade por casal e por posição ocupada, aproveitamento das matrizes
- **RF-BI-02** `[I]` **Indicadores de atendimento:** solicitado × atendido, tempo médio de resposta, taxa de recusa por motivo, aderência de data e **desvio entre previsão e realidade** — este calibra a expectativa de produção de `RN-01`
- **RF-BI-03** `[I]` **Consumo por projeto:** autorizado, consumido, saldo e histórico de entregas. Documento de prestação de contas à comissão de ética
- **RF-BI-04** `[M]` **Trilha de auditoria.** Todo evento que altera estado de animal, casal, compromisso, cota ou permissão registra autor, data/hora, valor anterior e novo. Imutável e consultável por entidade e período
- **RF-BI-05** `[I]` **Exportação** tabular aberta em todo relatório. A equipe vai continuar cruzando dados por fora — melhor apoiar do que combater

---

## 15. Requisitos não funcionais

- **RNF-01** `[M]` **Servidor como fonte única de verdade.** Regra de negócio, cálculo de data, permissão e filtragem acontecem no servidor. O cliente apresenta e coleta; não decide. Nenhum dado exibido pode ser fabricado no cliente
- **RNF-02** `[M]` **Consistência sob concorrência.** Vários técnicos operam ao mesmo tempo. Reserva e confirmação são transacionais e resistentes a corrida. Edição concorrente da mesma ficha é detectada e resolvida explicitamente, **sem sobrescrita silenciosa**
- **RNF-03** `[M]` **Uso no ambiente real.** O registro de parto, seleção e desmame acontece **dentro da sala, com o técnico de luvas e paramentado**. Telas de registro em tela pequena, alvos de toque generosos, mínimo de digitação (`PEN-08`)
- **RNF-04** `[M]` **Datas sem ambiguidade.** Exibição em dd/mm/aaaa. Armazenamento normalizado, fuso único, cálculo de idade em dias inteiros com regra explícita de arredondamento
- **RNF-05** `[M]` **Parametrização sem deploy.** Parâmetros biológicos, tolerâncias, pares genéticos, linhagens, modelos de estante, limiares e critérios de ordenação são dados administráveis
- **RNF-06** `[M]` **Preservação do histórico.** Nada é apagado: encerra-se, cancela-se ou corrige-se, sempre guardando o valor anterior. Exigência de auditoria de ética e sanitária
- **RNF-07** `[M]` **Proteção de dados pessoais** de pesquisadores: coleta mínima, acesso restrito por perfil, registro de acesso, política de retenção
- **RNF-08** `[M]` **Aderência técnica institucional.** Será avaliado e provavelmente hospedado pela TI da universidade: instalação documentada e reproduzível, configuração externa ao código, backup e restauração testados, log operacional (`PEN-09`)
- **RNF-09** `[I]` **Desempenho:** grade e quadro carregam em tempo interativo com a colônia cheia; a varredura responde em poucos segundos mesmo em cronograma com várias remessas. Limites numéricos dependem de `PEN-09`
- **RNF-10** `[I]` **Acessibilidade:** nenhuma informação só por cor; contraste adequado; operação por teclado nas telas de registro; leitura correta por leitor de tela nos formulários
- **RNF-11** `[I]` **Continuidade sem sistema.** O biotério não para se o sistema cair: exportação impressa do estado da colônia e do plano da semana, e caminho documentado de reentrada dos registros feitos em papel
- **RNF-12** `[I]` **Carga inicial.** Já existe colônia em operação: importar posições, casais, ciclos em andamento, projetos e cotas a partir das planilhas em uso (`PEN-09`)

---

## 16. Pendências

Informação que falta e trava definição. **As sete primeiras afetam modelagem — resolver antes de escrever código de persistência.**

**PEN-01 — Qual é a unidade rastreada: animal, lote ou caixa?**
A spec conta animais no pedido e caixas na colônia. Rastreio individual dá histórico por animal e atende auditoria mais rigorosa, mas exige identificação física de cada roedor — o que a operação pode não fazer hoje. Lote é mais leve e provavelmente suficiente.
*Impacto: **estrutural** — define o modelo de dados inteiro. Bloqueia o início da modelagem.*

**PEN-02 — O que acontece fisicamente no desmame?**
Os desmamados saem da caixa do casal — para onde vão? Ocupam slot próprio? Quantas caixas? M e F separados? Essa lacuna gera o conflito do quadro (`CONF-02`) e é onde a oferta "confirmada" de fato vive.
*Impacto: **estrutural** — define a entidade que sustenta os estados de reserva e expedição.*

**PEN-03 — Como funciona a reposição de matrizes?**
Casais encerram no 5º parto. De onde vêm os substitutos: da própria colônia, de aquisição externa, da piloto? Qual grupo genético recebe qual? Existe plano de renovação que o sistema deveria apoiar e não está descrito.
*Impacto: **alto** — sem isso a colônia se esvazia e o sistema não avisa.*

**PEN-04 — Qual a diferença entre colônia Piloto e Produção?**
Parâmetros diferentes, finalidades diferentes, ou a piloto alimenta a produção? Animais da piloto podem atender pedido? É rótulo ou tem regra?
*Impacto: **médio** — afeta elegibilidade no motor.*

**PEN-05 — De onde vem a expectativa de 4 M / 4 F?**
Aparece como constante, mas a spec também diz que não há limite de filhotes e que o técnico decide. É média histórica? Varia por espécie e linhagem? *Proposta:* parâmetro configurável, alimentado pela média real observada e ajustável pelo gestor.
*Impacto: **alto** — base de toda a oferta projetada. Errado, o sistema promete o que não existe.*

**PEN-06 — Qual a regra sanitária de quarentena?**
Aparece só como estado colorido, sem regra. O que dispara? Quem decreta? Abrangência (caixa, estante, sala)? Duração? O que fica bloqueado? O que acontece com os compromissos já assumidos?
*Impacto: **alto** — é o evento de exceção mais grave de um biotério.*

**PEN-07 — Quem decide o replanejamento quando a previsão frustra?**
Ninhada veio menor e havia compromisso firmado. O sistema realoca sozinho, sugere e espera decisão, ou só alerta? Se realoca, com que prioridade entre projetos concorrentes — ordem de chegada, urgência, hierarquia?
*Impacto: **alto** — sem resposta, `RF-MOT-10` fica sem especificação.*

**PEN-08 — Como é a rotina real do técnico na sala?**
Densidade máxima por caixa (norma aplicável)? Periodicidade de troca? Fórmula de consumo de ração e maravalha? Como a caixa é identificada fisicamente hoje? O registro é feito na sala ou depois, na antessala? Com que dispositivo?
*Impacto: **médio** — define agrupamento, baixa de insumo e desenho das telas de registro.*

**PEN-09 — Quais as condições da TI institucional?**
Protocolo real de autenticação e existência de homologação; onde a aplicação vai rodar e quem opera; restrições de tecnologia impostas; e **volumetria** (posições, casais ativos, solicitações/mês, usuários).
*Impacto: **alto** — **maior risco de cronograma do projeto**. Integração com SSO institucional costuma levar semanas por motivo burocrático, não técnico. Levantar já.*

**PEN-10 — Como funciona a cota de ética na prática?**
Cota é total por projeto, ou por espécie, linhagem e sexo? Consumida na solicitação, na aprovação ou na entrega? Devolução, perda ou morte em trânsito repõem cota? Há integração com sistema da comissão ou cadastro manual?
*Impacto: **alto** — a cota é limite legal, não conveniência. Errar expõe a instituição.*

**PEN-11 — Quem aprova, e em quanto tempo?**
A spec diz "gestor ou técnico", o que é ambíguo. Há alçada por quantidade? Prazo de resposta comprometido? Recurso contra recusa? O que acontece se ninguém analisar?
*Impacto: **médio** — define a máquina de estados da solicitação.*

**PEN-12 — Como as pessoas são avisadas?**
Canal (e-mail institucional, dentro do sistema, outro), quais eventos, para quem, com que frequência. Sem definição, ou o sistema é mudo ou vira spam — e nos dois casos o pesquisador volta a telefonar.
*Impacto: **médio** — afeta adoção mais que arquitetura.*

**PEN-13 — Como se confirma a gestação?**
O estado *matriz grávida* existe na spec, mas não o evento que o produz. Quem confirma — técnico ou veterinário? Por que método (palpação, peso, inspeção visual)? Em que janela após o acasalamento? É obrigatório ou opcional? O que acontece quando não confirma: o casal é refeito, e a partir de que data?
*Impacto: **médio** — define `RF-REP-11` e melhora a confiabilidade de toda a oferta projetada. Hoje o sistema trata "acasalou" e "está grávida" como a mesma coisa.*

**PEN-14 — Por que caixa "preparada para envio" continua elegível?**
A spec inclui esse estado entre os varridos pelo motor. Significa que dá para remanejar um lote já separado, ou é engano? Se dá, com que prioridade em relação a quem já tinha reservado?
*Impacto: **médio** — afeta a elegibilidade no motor e o significado do estado.*

**PEN-15 — As cinco seções que o cliente deixou em branco**
Na spec v2.4 estão vazias: *fluxograma operacional*, *indicadores reprodutivos (BI)*, *integrações externas*, *requisitos de segurança* e *estrutura de diretórios*. Não é descuido de formatação — é ausência de definição, e **duas delas (integrações e segurança) são exatamente onde a TI institucional vai apertar**. O que este documento traz nas seções 14 e 15 é proposta nossa, não levantamento: precisa ser validado como se fosse novo.
*Impacto: **alto** — risco de escopo silencioso.*

---

## 17. Conflitos identificados na spec do cliente

Contradições internas na v2.4. Precisam ir para o cliente — não são erro de leitura nossa, e três mudam resultado de cálculo.

**CONF-01 — A idade conta do nascimento ou do desmame?** `PRIORIDADE MÁXIMA`
A seção 1.6 diz que a varredura considera a **data de nascimento**. A 6.1 define **idade = entrega − data de desmame**. São 22 dias de diferença e isso desloca todo o resultado do motor. A leitura biológica usual é a partir do nascimento; o cálculo descrito no motor usa desmame.
*Quebra o motor de busca.*

**CONF-02 — Quadro só com casal ativo × estados pós-desmame** `ALTA`
A regra diz que o quadro exibe apenas caixas com casal ativo, mas "preparada para envio" e "expedida" tratam de animais já desmamados. Ou a regra está errada, ou falta a entidade de caixa de recria. Ligado a `PEN-02`.

**CONF-03 — Ninhada sem limite × constante de 4M/4F** `ALTA`
A seção 1.8 diz que não há limite e o técnico decide pelo protocolo. A 6.1 usa constante de 4M/4F derivada de "5 nascidos − 1 eutanásia por sexo". Uma das duas afirmações não é verdadeira na operação. Ligado a `PEN-05`.

**CONF-04 — Dois sistemas de estado concorrentes** `MÉDIA`
A spec define um conjunto de estados semânticos (incluindo quarentena e gestação confirmada) e outro por coluna do quadro, e depois diz que a grade exibe o estado da coluna. Ou o primeiro conjunto está morto, ou informação — justamente quarentena e gestação — sumiu da visualização.

**CONF-05 — Prazo de entrega de produção nova** `MÉDIA`
A regra de viabilidade define o prazo como gestação + aleitamento + idade pedida. O detalhamento do motor cita entrega em 90 dias fixos, que não decorre da fórmula. Verificar se há margem operacional embutida e não explicitada.

**CONF-06 — Critério de ordenação da sugestão** `ALTA`
A seção 1.7 diz que o sistema sugere as caixas **"do mais velho para o mais novo"** dentro da faixa aceita. A 6.1 diz **"idade mais próxima da pedida"**. São critérios diferentes e dão resultados diferentes: pedido de 30 dias com faixa 27–33, a primeira regra sugere o animal de 33, a segunda sugere o de 30.
*Provável intenção:* **mais velho primeiro** — o animal que envelhece sai da faixa e vira perda; é a regra que evita desperdício de plantel. Confirmar, porque muda o resultado do motor em toda solicitação. Afeta `RF-MOT-04`.

**CONF-07 — Letra identifica linha ou coluna na estante?** `MÉDIA`
O quadro de layouts descreve *"8L x 7C (A–G)"* — 7 letras para 7 colunas — mas também *"8L x 8C (A–H)"*, onde 8 letras servem para os dois eixos. Pela contagem, a letra parece designar a **coluna** e o número a **linha**, mas o texto sugere o contrário. Precisa bater com a etiqueta física da estante, senão o técnico procura a caixa no lugar errado. Afeta `RF-INF-02`.

---

## 18. Faseamento sugerido

Ordenado por dependência e risco, não por facilidade. Sujeito a revisão após o fechamento das pendências.

| Fase | Entrega | Depende de |
|---|---|---|
| **0 · Descoberta** | Fechamento das pendências, visita ao biotério, acesso às planilhas atuais, contato com a TI institucional | Reunião com o cliente |
| **1 · Colônia** | Infraestrutura, casais, ciclos reprodutivos, registro de eventos, grade de ocupação, auditoria | PEN-01, PEN-02, PEN-05 |
| **2 · Oferta** | Estados de caixa, quadro de acompanhamento, alertas operacionais, apuração de disponibilidade | Fase 1, PEN-06 |
| **3 · Demanda** | Projetos e cotas, solicitação, aprovação, motor de atendimento, compromissos, expedição | Fase 2, PEN-07, PEN-10, PEN-11 |
| **4 · Operação plena** | Insumos, notificações, indicadores, prestação de contas | Fase 3, PEN-08, PEN-12 |
| **5 · Integrações** | Autenticação institucional em produção, consulta ao sistema de ética, consulta em linguagem natural | PEN-09 |

> **Recomendação de sequência:** a autenticação institucional (fase 5) precisa ser **iniciada na fase 0**, mesmo entregando por último — a liberação depende de terceiros e é o item com maior chance de atrasar o projeto inteiro.

---

## Anexo A — Dados de carga inicial

Valores concretos fornecidos pelo cliente. São **dados de cadastro**, não regra de código — entram por carga inicial e podem mudar sem alteração de software (`RNF-05`).

### A.1 — Espécies e linhagens

| Espécie | Nome científico | Linhagens |
|---|---|---|
| Rato | *Rattus norvegicus* | Wistar, SHR, Kyoto |
| Camundongo | *Mus musculus* | Swiss, C57BL/6J |

Cada espécie tem duas colônias em paralelo (Piloto e Produção); cada colônia pode conter uma ou mais linhagens. Infraestrutura atual: **3 salas de criação independentes**.

### A.2 — Modelos de estante

| Fabricante | Modelo | Capacidade | Face frontal | Face traseira |
|---|---|---|---|---|
| ALESCO | 1 | 128 | 8 × 8 (A–H) | 8 × 8 (I–P) |
| ALESCO | 2 | 50 | 5 × 5 (A–E) | 5 × 5 (F–J) |
| TECNIPLAST | 1 | 112 | 8 × 7 (A–G) | 8 × 7 (H–N) |
| TECNIPLAST | 2 | 40 | 5 × 4 (A–D) | 5 × 4 (E–H) |

Observações que valem para `RF-INF-01` e `RF-INF-02`:

- A sequência de letras é **contínua entre as faces** (frontal A–H, traseira I–P) — ou seja, a face não é um sufixo, faz parte do endereço
- Se a letra designa linha ou coluna está ambíguo na spec: ver `CONF-07`
- Estes quatro modelos são carga inicial. **Um quinto modelo tem que entrar por cadastro, não por deploy**

### A.3 — Grupos genéticos e pares válidos

Grupos: **A, B, C, D, E**
Pares permitidos: **AB, BC, CD, DE, EA** (rotação em anel)
Identificação do casal: 2 caracteres, o primeiro é o grupo do macho (ex.: `AB` = macho A + fêmea B)

### A.4 — Formato do número de projeto de ética

```
23080.XXXXXX/AAAA-XX
```

Máscara de validação de `RF-DEM-06`. Confirmar com o cliente se o prefixo `23080` é fixo (código da instituição) ou se o sistema precisa aceitar outros — pesquisador com projeto de instituição parceira é caso plausível.

---

*Documento de requisitos CPMR · v0.2 · 27/08/2026 · elaborado a partir da spec do cliente v2.4 e do protótipo existente.*
*Decisões de tecnologia, arquitetura e modelagem física não fazem parte deste documento.*
