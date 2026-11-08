# Nidus - front-end

Interface web do Nidus, um sistema de controle de produção de roedores. O cliente do
projeto é o CPMR/UFSC (Centro de Produção e Manutenção de Roedores da Universidade
Federal de Santa Catarina).

Projeto Integrador: Sistema Web - SATC, Engenharia de Software, fase 4, 2026.2.
Repositório irmão: [nidus-back-end](https://github.com/Jota-Pais/nidus-back-end).

## Escopo

O Nidus é o equivalente, na nossa stack, do sistema que o próprio cliente montou
(`Malcoringa/Sistema-CPMR-UFSC`, branch `master` - o `main` de lá só tem o
README). A referência de requisitos é a spec dele, o `instructions.md` v2.7, de
18/09/2026. Se o sistema do cliente não tem, a gente não faz.

| Tela | Quem usa | O que faz |
|---|---|---|
| Kanban | Técnico, gestor | Um quadro por espécie, só de leitura, colunas Livres, Estoque, Reserva e Enviado. A caixa do casal fica em Livres e diz quantos reservados tem; a de estoque muda de coluna sozinha |
| Estantes | Técnico, gestor | As estantes de cada sala, faces frontal e traseira lado a lado, cada caixa na cor da coluna do kanban |
| Ficha da caixa | Técnico, gestor | Abre pelo card ou pela célula. Forma o casal e registra parto, eutanásia de seleção e desmame, do 1º ao 5º parto |
| Solicitar animais | Todos | O pedido do pesquisador: nome, protocolo CEUA, linhagem, machos, fêmeas ou qualquer sexo, faixa de idade, data de entrega e observações |
| Busca de atendimento | Técnico, gestor | Quais caixas atendem um pedido e quantos casais novos faltam. Aloca as caixas sugeridas |

Nenhuma regra de negócio roda aqui: datas previstas, busca, permissão e
cruzamento são do back-end. O front mostra e coleta.

## Rodar

```bash
npm install
cp .env.example .env     # VITE_API_URL aponta para o back-end local
npm run dev              # http://localhost:5173
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento do Vite |
| `npm run build` | Type-check e build de produção |
| `npm test` | Vitest |
| `npm run lint` | ESLint |

## Stack

React + TypeScript, Vite, Ant Design, TanStack Query, react-router, Zod e dayjs.
Testes no Vitest. Deploy na Vercel, a partir do GitHub.

O visual é o do Nidus: paleta da UFSC, Plus Jakarta Sans nos títulos, Inter no texto e
JetBrains Mono nos códigos. Cor, raio, sombra e fonte saem de
`src/app/tokens.ts` (tema do Ant Design) e `src/app/tokens.css` (CSS das telas).
Não são espelho: o CSS tem tokens que o tema não usa, e o `tokens.ts` guarda
também chaves que só o CSS usa. O `tokens.test.ts` confere que o valor
presente nos dois é o mesmo. A cor de cada coluna do kanban também é token
(`--estado-livres-fundo` e companhia), e a grade de estantes usa a mesma.

A paleta tem uma cor de ação, o azul da UFSC: botão, link, foco, item ativo.
Os estados dela (passar o mouse, clicar) e os tons claros (fundo e contorno de
etiqueta, rótulo, menu ativo e aviso de informação) não são escolhidos à mão.
Saem da cor pela regra de `src/app/cor.ts`, que o `tokens.css` escreve com
`color-mix`, e o tema do Ant Design recebe a família inteira. Trocar a cor de
ação é mudar uma linha em cada arquivo de tokens. Cor literal só existe nesses
arquivos: o `tokens.test.ts` falha se aparecer em componente ou tela, e também
confere o contraste de cada texto sobre o fundo em que aparece.

O login é por cookie de sessão `httpOnly`, então toda chamada vai com
`credentials: 'include'` (ver `src/lib/api.ts`).

Quem entra pela primeira vez, ou esqueceu a senha, define uma em `/definir-senha`:
recebe um código no e-mail da UFSC, confirma e escolhe a senha. Conta nova nasce como
pesquisador. As chamadas estão em `src/auth/acesso.ts`.

## Estrutura

```
src/
  app/       rotas, cache do TanStack Query, tokens, tema e ambiente validado por Zod
  auth/      sessão do usuário
  componentes/ cabeçalho de tela, seção, botão, etiqueta, aviso e o resto do visual
  layout/    casca com a barra lateral, menu por perfil, rota protegida, carregamento e erro
  dominio/   tipos da API, colunas do kanban, cores dos partos e as consultas (useKanban, useFicha...)
  lib/       chamada à API, mensagens de erro e datas (sempre dd/mm/aaaa)
  telas/     uma tela por arquivo, com o CSS ao lado
```

## Deploy na Vercel

Framework Vite, build `npm run build`, saída em `dist/`. Push em `main` publica
sozinho em https://thenidus.vercel.app.

| Variável | Valor em produção |
|---|---|
| `VITE_API_URL` | `https://thenidus.vercel.app`, a própria URL do front, sem barra no final |
| `VITE_AMBIENTE` | `producao` |

As duas entram no build, então mudar o valor exige redeploy. Não defina
`NODE_ENV` na Vercel: com `production` ela deixa de instalar `vite` e
`typescript`, que são devDependencies.

O `vercel.json` faz duas coisas:

1. Reescreve `/api/*` e `/saude` para a API na Render
   (`nidus-cpmr-api.onrender.com`). O navegador só fala com `*.vercel.app` e o
   cookie de sessão fica de primeira parte. Sem isso o Safari, o iPhone, o Chrome
   anônimo e o Brave descartam o cookie e o login volta 401 na requisição
   seguinte.
2. Manda o resto para `index.html`, senão F5 em `/estantes` dá 404 da Vercel.

## Equipe

| Integrante | Papel |
|---|---|
| Arthur Serafim Santin | Líder, Scrum Master e QA |
| João Carlos País | Banco de dados |
| Miguel Guerra | Back-end |
| Gabriel Ugione | Front-end e UX/UI |
