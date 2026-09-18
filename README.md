# Nidus — front-end

Interface web do **Nidus**, sistema de gestão de produção e manutenção de
roedores do **CPMR/UFSC** (Centro de Produção e Manutenção de Roedores da
Universidade Federal de Santa Catarina).

Projeto Integrador: Sistema Web — SATC, Engenharia de Software, fase 4, 2026.2.

## O que este repositório abriga

As telas do sistema, e só. **Nenhuma regra de negócio roda aqui** (`RNF-01`):
cálculo de data, viabilidade de prazo, varredura por idade, validação de
cruzamento, permissão e filtragem são do servidor. O front apresenta e coleta.

O que o cliente pode fazer é esconder um botão por conveniência — nunca
autorizar (`RF-ACS-02`).

## Rodar

```bash
npm install
cp .env.example .env
npm run dev
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento do Vite |
| `npm run build` | Type-check e build de produção |
| `npm run preview` | Serve o build |
| `npm test` | Vitest |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Stack

Definida pela equipe na entrega de infraestrutura e registrada em
`docs/decisoes-de-stack.md`.

| Camada | Escolha |
|---|---|
| UI | **React + TypeScript** |
| Componentes | **Ant Design** |
| Build e dev server | **Vite** |
| Roteamento | **react-router** |
| Validação de formulário e de ambiente | **Zod** |
| Datas | **dayjs** (já é a dependência de data do Ant Design) |
| Testes | **Vitest** |
| Deploy | **Vercel**, a partir do GitHub |

### Decisões que este repo aplica

As três que mais aparecem no código do dia a dia:

| Decisão | Escolha |
|---|---|
| Autenticação | **Cookie de sessão `httpOnly`** — toda requisição com `credentials: 'include'` |
| Estado de servidor | **TanStack Query** — `invalidateQueries` é o que cumpre o `RF-CIC-02` |
| Drag-and-drop do quadro | **`@dnd-kit`**, numa segunda passada — até lá, botão "mover para" no card |

Decisão fechada não se rediscute sem a equipe.

⚠️ **`SameSite=None; Secure` não é detalhe.** Front na Vercel e API na Render
ficam em domínios diferentes: sem isso o login funciona em `localhost` e quebra
em produção. Ver `docs/contrato-api.md` §1.2.

## Documentos compartilhados — `docs/`

`docs/` é **byte a byte igual** em `nidus-front-end` e `nidus-back-end`. Foi a
solução escolhida para o compartilhamento de tipos: os dois repositórios são
independentes e cada lado escreve os próprios tipos a partir do mesmo texto.

| Arquivo | O que é |
|---|---|
| `contrato-api.md` | **Fonte única da integração.** Endpoints, formatos, erros, perfil exigido por rota |
| `decisoes-de-stack.md` | O que está decidido e não se rediscute sem a equipe |
| `requisitos.md` | Documento de requisitos v0.2, sobre a spec v2.4 do cliente |
| `modelo-de-dados.md` | Modelo lógico do banco: o MVP em 14 tabelas |

> **Mudou a API? Muda o arquivo nos dois repos**, no mesmo PR ou em PRs irmãos.
> Um lado alterar sozinho é quebrar o outro sem aviso.

⚠️ O `contrato-api.md` §1.1 aponta para `src/dominio/tipos.ts` e
`src/dominio/estados.ts` e diz que **os valores deles são o contrato**. O
`char(1)` do banco nunca cruza a rede: quem traduz é o back-end. Renomear uma
chave desses dois arquivos quebra a API.

## Telas

Lista alinhada a `docs/requisitos.md` e ao backlog do Trello — cada tela existe
como card próprio no quadro. Tela que ainda não começou já existe como arquivo em
`src/telas/`, renderizando o stub `EmConstrucao` com ator, requisitos e o que
ela vai fazer. **O que já está pronto é o Kanban e o histórico de commits que
respondem, não este arquivo.**

### MVP

| Tela | Ator | Requisitos |
|---|---|---|
| **Login** | todos | `RF-ACS-01`, `RF-ACS-02` |
| **Cadastro de infraestrutura** | Gestor | `RF-INF-01`, `RF-INF-02`, `RNF-05` |
| **Grade de estantes** — duas faces lado a lado, um card por caixa | Técnico | `RF-INF-03`, `RF-INF-06` |
| **Ficha da posição** — modal, aberta de qualquer card da grade ou do quadro | Técnico | `RF-INF-04`, `RF-REP-02` |
| **Quadro de comprometimento** — um por espécie, 5 colunas de estado | Técnico / Gestor | `RF-CIC-01` a `RF-CIC-05` |
| **Painel de alertas do ciclo** | Técnico | `RF-REP-07` |
| **Registros do técnico** — parto, eutanásia de seleção, desmame, mortalidade | Técnico | `RF-REP-03` a `RF-REP-06`, `RNF-03` |
| **Cadastro de projeto de ética e cota** | Gestor | `RF-DEM-06` |
| **Nova solicitação** | Pesquisador | `RF-DEM-01`, `RF-DEM-02` |
| **Acompanhamento de solicitações** | Pesquisador | `RF-DEM-05` |
| **Motor de atendimento / análise da solicitação** | Técnico / Gestor | `RF-MOT-05`, `RF-MOT-06`, `RF-MOT-09` |

### Fases posteriores

Agrupamento e expedição (`RF-EXP-*`), insumos (`RF-INS-*`), indicadores e
auditoria (`RF-BI-*`), notificações (`RF-DEM-07`), contraproposta
(`RF-DEM-04`), quarentena e movimentação de caixa.

### Dois requisitos transversais, não features

Valem para grade, quadro e ficha ao mesmo tempo — tratados numa fonte única em
`src/dominio/estados.ts`, não repetidos por tela:

- **`RNF-10` — nada só por cor.** Toda codificação de estado carrega segundo
  canal (marcador e sigla) por acessibilidade e impressão P&B. Uma legenda
  compartilhada pelas três telas, não três legendas diferentes.
- **`RNF-04` — data sem ambiguidade.** Exibição sempre em `dd/mm/aaaa`, idade em
  dias inteiros com regra explícita de arredondamento. Centralizado em
  `src/lib/data.ts`; nenhuma tela formata data por conta.

## Estrutura

```
docs/         documentos espelhados com o back-end (ver acima)
src/
  app/        configuração da aplicação: rotas, tema, tokens, ambiente por Zod
  componentes/ biblioteca de componentes do projeto — ver o README de lá
  layout/     casca: navegação por perfil, rota protegida, erro e carregamento
  auth/       perfil da sessão do usuário
  dominio/    tipos e legenda de estado (fonte única do RNF-10 e do contrato)
  lib/        datas e idade (fonte única do RNF-04)
  fixtures/   dados de carga inicial do Anexo A, para desenvolver sem API
  telas/      uma tela por linha da tabela acima
```

### Sobre `componentes/`

Tela nova não decide de novo o que já foi decidido: formato de data, marcador
de estado, altura de controle, conversão de `Dayjs` para `aaaa-mm-dd`. Um
import resolve:

```tsx
import { CabecalhoDaTela, DataPrevistaOuReal, Pilha, Secao } from '@/componentes'
```

Entra na biblioteca o que serve a **mais de uma tela**, ou o que carrega
decisão que não pode variar entre telas. Componente de uma tela só mora ao
lado da tela. O catálogo completo e as regras estão em
`src/componentes/README.md`.

### Design system e tokens

Cor, tipografia, raio, sombra, altura de controle e movimento saem de um lugar
só: `src/app/tokens.ts` (para o tema do Ant Design) e `src/app/tokens.css`
(para o CSS dos componentes). Os dois são conferidos por `tokens.test.ts` —
mudar um sem o outro quebra o teste.

**Nenhum componente escreve cor, raio, sombra ou fonte literal.** Se o valor
não está em `tokens.ts`, ele não é do design system.

Duas coisas do design system que também são requisito, e por isso não se
negociam por preferência visual:

| Token | Valor | Requisito |
|---|---|---|
| Altura de controle | `48px` | `RNF-03` — técnico de luvas, tela pequena |
| Anel de foco | acento, sempre visível | `RNF-10` — operável por teclado |

### Sobre `fixtures/`

São os **dados de carga inicial reais** do cliente (Anexo A do documento de
requisitos): espécies, linhagens, os 4 modelos de estante, grupos genéticos e
pares válidos, máscara do projeto de ética, parâmetros do ciclo biológico e a
tabela de tolerância. Servem para desenvolver tela antes da API existir, e para
testar que a topologia fecha com a capacidade declarada.

Não é mock de comportamento. O `RNF-01` continua valendo e **nenhum número
exibido ao usuário pode ser calculado aqui**.

⚠️ Em particular, `enderecosDaEstante()` gera grade **só para teste e
desenvolvimento**. Em produção quem gera é o back-end: `GET
/api/estantes/:id/grade` já devolve as posições das duas faces, as vazias com
`caixa: null`, porque não existe tabela `slot` (decisão D-04). O front desenha o
que recebe.

## Requisito em aberto que afeta tela

O que ainda depende de resposta do cliente tem ID `CONF-` ou `PEN-` em
`docs/requisitos.md` e card no Trello. A regra aqui é uma: onde a tela precisa de
uma resposta que não existe ainda, a escolha entra como **parâmetro num lugar
só** — argumento de função ou constante nomeada de um módulo —, nunca como número
literal no meio do componente. É por isso que `idadeEmDias()` recebe a data-base
como argumento e o eixo da letra da estante mora em `EIXO_DA_LETRA`. Quando o
cliente responder, muda um lugar.

## Deploy na Vercel

Projeto a partir do GitHub, framework **Vite** (detectado sozinho), build
`npm run build`, saída em `dist/`.

| Variável | Valor em produção |
|---|---|
| `VITE_API_URL` | URL pública da API na Render, sem barra no final |
| `VITE_AMBIENTE` | `producao` |

Não definir `NODE_ENV` na Vercel: com `NODE_ENV=production` ela deixa de
instalar as devDependencies, e `vite` e `typescript` estão lá.

O `vercel.json` na raiz reescreve toda rota para `index.html`. Sem ele, abrir
`/quadro` direto ou dar F5 em `/estantes/3` devolve 404 da Vercel, porque quem
resolve rota é o `createBrowserRouter`, no navegador.

Depois de publicar, voltar na Render e colocar a URL de produção em
`CORS_ORIGEM`. O teste que prova o arranjo: login em produção grava o cookie
`nidus_sessao` e ele sobrevive a um F5 — é o `SameSite=None; Secure`
funcionando entre domínios.

## Repositório irmão

Back-end: https://github.com/Jota-Pais/nidus-back-end

## Equipe

| Integrante | Papel |
|---|---|
| Arthur Serafim Santin | Líder, Scrum Master e QA |
| João Carlos País | Banco de dados |
| Miguel Guerra | Back-end |
| Gabriel Ugione | Front-end e UX/UI |
