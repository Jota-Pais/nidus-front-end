# Decisões de stack — Nidus

**Atualizado em 03/09/2026.** Idêntico em `nidus-back-end/docs/` e
`nidus-front-end/docs/`.

Este arquivo registra **o que já está decidido e não se rediscute sem a equipe**.
Origem: seção "Decisões da equipe — stack" de `requisitos.md` (20/08/2026), mais
as quatro decisões que estavam em aberto e foram fechadas em 03/09/2026.

> Requisitos e modelagem estão em `requisitos.md` e `modelo-de-dados.md`, nesta
> mesma pasta. O contrato da API está em `contrato-api.md`.

---

## 1. Fechado em 20/08/2026

| Camada | Escolha |
|---|---|
| **Front-end** | React + TypeScript, componentes do **Ant Design**, build e dev server no **Vite** |
| **Back-end** | Node + **Express** + TypeScript, ORM e migrations no **Prisma** |
| **Banco** | **PostgreSQL** |
| **Validação** | **Zod** no limite de cada rota, com o tipo de TS inferido do schema (`z.infer`) |
| **Testes** | **Vitest**, nos dois repositórios |
| **Hospedagem** | Postgres na **Neon** · API na **Render** · front na **Vercel** — tudo em plano gratuito, deploy a partir do GitHub |
| **Docker** | **Não.** O Postgres de desenvolvimento é o mesmo serviço gerenciado da produção. Custo aceito: precisa de internet para desenvolver |

### 1.1 Divisão de responsabilidade na validação

Vale fixar para não duplicar regra em duas camadas:

| Camada | Responsabilidade | Exemplo |
|---|---|---|
| **Zod** | Forma, tipo, formato e regra entre campos | `idadeDesejadaDias` inteiro ≥ 21 |
| **Serviço** | Regra que precisa consultar o banco | Timeline reversa, cota disponível |
| **Postgres** | Invariante que nunca pode ser violada | `CHECK` dos pares AB/BC/CD/DE/EA |

Query param chega sempre como string — resolver com `z.coerce`, não com `Number()`
à mão.

### 1.2 Migrations: um banco só, um único autor

Abordagem **migrate-first**: o `schema.prisma` é a fonte da verdade e o Prisma
gera as migrations. **Um banco oficial na Neon, sem branch por pessoa.**

| Quem | Comando | Efeito |
|---|---|---|
| Responsável pelo banco (João Carlos) | `prisma migrate dev` | Cria a migration. **Único comando que pode resetar o banco** |
| Miguel, Gabriel, Arthur | `prisma migrate deploy` | Só aplica o pendente, em ordem. Nunca dropa nada |

Alteração de schema é **pedida ao responsável pelo banco**, não feita direto.

> **Por que `migrate dev` é o risco.** Quando o histórico de migrations diverge
> do que está gravado no banco, ele dropa e recria o schema para reaplicar tudo
> em ordem. É comportamento padrão, não acidente: apaga a massa de teste de quem
> estiver usando o banco.

### 1.3 Riscos aceitos, já registrados

- **A API na Render dorme** por inatividade (~15 min) e acordar leva de 30s a
  1min. Abrir o sistema alguns minutos antes de qualquer apresentação. Considerar
  o plano pago mais barato só no mês de dezembro
- **Não usar o Postgres gratuito da Render** — o plano free tem prazo e o banco é
  removido depois de um período. Por isso a Neon

---

## 2. Fechado em 03/09/2026

As quatro que estavam em aberto no `requisitos.md`. Todas travavam back e front
ao mesmo tempo.

### 2.1 Autenticação — **cookie de sessão `httpOnly`**

Descartado: JWT em `localStorage`.

**Por quê:** o navegador manda o cookie sozinho e o JS não consegue lê-lo, então
XSS não rouba a sessão. Logout é apagar do lado do servidor, o que dá **revogação
real** — necessária para o `RF-ACS-04` (gestor delega aprovação por período). JWT
em `localStorage` é legível por qualquer script e não dá para revogar antes de
expirar.

**O detalhe que morde:** front (Vercel) e API (Render) ficam em **domínios
diferentes**. Exige `SameSite=None; Secure` no cookie e CORS com
`credentials: true` e origem explícita — `*` é recusado pelo navegador quando há
credenciais. Sem isso o login funciona em `localhost` e quebra em produção.

Detalhes de implementação em `contrato-api.md`, seção 1.2.

### 2.2 Estado de servidor no front — **TanStack Query**

Descartados: Zustand e Redux para este papel.

**Por quê:** o problema real é o `RF-CIC-02` — grade, quadro e ficha leem os
mesmos dados e **nunca podem divergir**. Alterar pela ficha tem que refletir nas
outras duas. TanStack Query resolve isso por desenho: `invalidateQueries` depois
de uma mutação atualiza as três telas. Zustand e Redux são estado de *cliente*;
com eles seria preciso reescrever à mão o refetch e a sincronização.

Zustand entra depois, se sobrar estado puramente de interface (filtro
selecionado, modal aberto). Não é o caso hoje.

### 2.3 Compartilhamento de tipos — **`contrato-api.md` idêntico nos dois repos**

Descartados: duplicar à mão sem fonte comum; pacote npm privado; OpenAPI gerado.

**Por quê:** os dois repositórios são independentes e não compartilham tipos.
Duplicar sem fonte comum diverge na primeira semana. Pacote npm privado é a
solução correta, mas exige um terceiro repositório e publicação — infra demais
para quatro pessoas num semestre. OpenAPI gerado a partir de Zod exige
`zod-to-openapi` e configuração que ainda não se paga.

**Como funciona:** `docs/contrato-api.md` é **byte a byte igual** nos dois
repositórios. Cada lado escreve os próprios tipos a partir dele. Mudou a API?
Muda o arquivo **nos dois repos** e avisa a equipe, no mesmo PR ou em PRs
irmãos. Um lado alterar sozinho é quebrar o outro sem aviso.

Migra para OpenAPI gerado se a manutenção manual doer.

### 2.4 Drag-and-drop do quadro — **`@dnd-kit`, depois da N2**

Descartado: `react-beautiful-dnd` (arquivado pela Atlassian). O Ant Design não
tem o componente.

**Por quê `@dnd-kit`:** é o sucessor de fato, é mantido, e tem navegação por
teclado — que o `RNF-10` exige.

**Por que depois da N2:** o `RF-CIC-03` diz que transição que contraria
compromisso exige confirmação explícita, ou seja, **o drop não pode aplicar a
transição direto** de qualquer forma. Um botão "mover para" no card entrega o
mesmo comportamento com muito menos risco, e o arrastar entra na sequência sem
retrabalho — as duas interações chamam o mesmo `PATCH /api/caixas/:id/estado`.

---

## 3. Ainda em aberto

Nada de stack. O que trava agora é **pendência de requisito**, não de tecnologia
— e é com o cliente, não com a equipe:

| ID | O que falta | Trava |
|---|---|---|
| `CONF-01` | Idade conta do nascimento ou do desmame | O motor inteiro. **Prioridade máxima** |
| `CONF-06` | Ordenação: mais velho × idade mais próxima | `RF-MOT-04` |
| `CONF-07` | A letra da estante é linha ou coluna | Geração de `caixa.codigo`. Ver `contrato-api.md` §5 |
| `PEN-01` | Unidade rastreada: animal, lote ou caixa | Modelo de dados (hipótese: quantidade ancorada em `parto`) |
| `PEN-02` | Destino do desmamado | `parto.id_caixa_recria` anulável hoje |
| `PEN-05` | De onde vem a expectativa 4M/4F | Toda a oferta projetada |
| `PEN-09` | Condições da TI institucional | SSO e volumetria. **Maior risco de cronograma** |

---

*Decisões de stack Nidus · 03/09/2026 · idêntico nos dois repositórios*
