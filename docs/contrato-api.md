# Contrato de API — Nidus

**v1.0 · 03/09/2026 · fonte única de verdade da integração**

Este arquivo é **idêntico** em `nidus-back-end/docs/` e `nidus-front-end/docs/`.
Os dois repositórios são independentes e não compartilham tipos: este documento
é o que impede a integração de divergir.

> **Regra de ouro:** ninguém muda rota, campo ou código de erro sem alterar este
> arquivo **nos dois repositórios** e avisar a equipe. Um lado alterar sozinho é
> quebrar o outro sem aviso.

Base: `requisitos-v0.2-spec-cliente-v2.4.md` (o *quê*) e `modelo-de-dados.md`
(a persistência). Este documento é o *como* os dois lados conversam.

---

## 1. Convenções

| Item | Regra |
|---|---|
| **Caminho base** | `/api` — tudo abaixo dele. O healthcheck é a única exceção: `GET /saude` |
| **Formato** | JSON em requisição e resposta, sempre. `Content-Type: application/json` |
| **Nomes de campo** | `camelCase` em português. `idCaixa`, `dtPartoReal`, `nascidoM` |
| **Data** | `aaaa-mm-dd` (string). Nunca timestamp para data de calendário |
| **Data e hora** | ISO 8601 em UTC: `2026-09-03T22:41:18.000Z` |
| **Exibição** | Responsabilidade do front: sempre `dd/mm/aaaa` (`RNF-04`). A API nunca formata |
| **Identificador** | `int` (o `id int4` do banco). Nunca UUID no MVP |
| **Ausência** | `null` explícito. Nunca omitir a chave, nunca string vazia |

### 1.1 O `char(1)` do banco nunca cruza a rede

O banco guarda estado em `char(1)` por exigência do `RNF-05` (parametrização sem
deploy — acrescentar valor a um `ENUM` do PostgreSQL é DDL). **A API traduz.**

O back-end é dono dessa conversão. O front nunca vê `'R'`, `'P'`, `'C'`.

| Conceito | Banco | API e front |
|---|---|---|
| `caixa.estado` | `R` | `em_reproducao` |
| | `P` | `parcialmente_comprometida` |
| | `T` | `totalmente_comprometida` |
| | `E` | `preparada_para_envio` |
| | `X` | `expedida` |
| `caixa.finalidade` | `R` `M` `C` `E` | `reproducao` `maternidade` `recria` `expedicao` |
| `parto.grau_certeza` | `C` `P` `J` | `confirmado` `previsto` `projetado` |
| `usuario.perfil` | `P` `T` `G` | `pesquisador` `tecnico` `gestor` |
| `caixa.face` | `1` `2` | `frontal` `traseira` |

Os valores da coluna da direita são exatamente os de
`nidus-front-end/src/dominio/tipos.ts` e `estados.ts`. **São eles o contrato.**

### 1.2 Autenticação

Cookie de sessão `httpOnly`, decidido em 03/09 (ver `decisoes-de-stack.md`).

- Cookie: `nidus_sessao`, `HttpOnly`, `Secure`, `SameSite=None`, `Path=/`
- `SameSite=None; Secure` é obrigatório porque front (Vercel) e API (Render)
  ficam em **domínios diferentes**. Sem isso o login funciona em `localhost` e
  quebra em produção — é o erro clássico deste arranjo
- O back precisa de CORS com `credentials: true` e **origem explícita**
  (`CORS_ORIGEM` no `.env`), nunca `*` — o navegador recusa `*` com credenciais
- O front faz toda requisição com `credentials: 'include'`
- Não existe token no corpo, no header nem no `localStorage`

### 1.3 Autorização

`RF-ACS-02`: **decidida no servidor, sempre.** O front pode esconder um botão
por conveniência, mas nunca autoriza. Toda rota abaixo traz o perfil exigido.

Filtragem de dados também é do servidor: o pesquisador não recebe dados da
colônia, nem filtrados no cliente. Ele recebe menos dados.

---

## 2. Erros

Toda resposta de erro tem exatamente esta forma:

```json
{
  "erro": {
    "codigo": "PAR_GENETICO_INVALIDO",
    "mensagem": "O par AC não está na rotação permitida.",
    "requisito": "RN-02",
    "campos": { "grupoFemea": "Com macho do grupo A, só é válido o grupo B." }
  }
}
```

- `codigo` — estável, para o front decidir comportamento. Nunca traduzir por texto
- `mensagem` — em português, já pronta para exibir ao usuário
- `requisito` — o ID do requisito violado. Opcional, mas preencher sempre que houver
- `campos` — só em erro de validação ou quando o erro aponta para campo específico

### 2.1 Códigos

| HTTP | `codigo` | Quando |
|---|---|---|
| 400 | `VALIDACAO` | Zod recusou a forma da entrada. `campos` obrigatório |
| 401 | `NAO_AUTENTICADO` | Sem cookie válido |
| 403 | `SEM_PERMISSAO` | Autenticado, perfil não alcança o recurso |
| 404 | `NAO_ENCONTRADO` | Recurso inexistente ou fora do alcance do perfil |
| 409 | `PAR_GENETICO_INVALIDO` | `RN-02` — par fora de AB/BC/CD/DE/EA |
| 409 | `CAIXA_JA_TEM_CASAL_ATIVO` | `RN-03` — máximo um casal ativo por caixa |
| 409 | `LIMITE_PARTOS_ATINGIDO` | `RN-04` — casal já teve 5 partos confirmados |
| 409 | `POSICAO_OCUPADA` | `RF-INF-05` — destino já tem caixa ativa |
| 409 | `DISPONIBILIDADE_EXCEDIDA` | `RN-09` — compromisso passaria do disponível |
| 409 | `TRANSICAO_CONTRARIA_COMPROMISSO` | `RF-CIC-03` — exige `confirmar: true` |
| 409 | `PRAZO_INVIAVEL` | `RN-06` — resposta traz `dataMinima` |
| 409 | `SEQUENCIA_INVALIDA` | Evento fora de ordem (desmame antes do parto, p. ex.) |
| 500 | `ERRO_INTERNO` | Falha não prevista. Nunca vaza stack para o cliente |

**409 é sempre regra de negócio.** O front pode tratar todo 409 como "mostrar a
`mensagem` ao usuário e não recarregar" sem conhecer cada código.

### 2.2 Exemplo de `PRAZO_INVIAVEL`

`RF-DEM-02` exige que, quando a data é inviável, o sistema **informe a data mais
próxima possível** em vez de só recusar:

```json
{
  "erro": {
    "codigo": "PRAZO_INVIAVEL",
    "mensagem": "Para 21 dias de idade, a entrega mais próxima é 08/11/2026.",
    "requisito": "RN-06",
    "dataMinima": "2026-11-08"
  }
}
```

---

## 3. Sessão

### `POST /api/sessao` — login
Público.

```json
{ "email": "tecnico@ufsc.br", "senha": "..." }
```

**200** + `Set-Cookie: nidus_sessao=...`
```json
{
  "usuario": { "id": 4, "nome": "Ana Souza", "email": "tecnico@ufsc.br", "perfil": "tecnico" }
}
```
**401** `NAO_AUTENTICADO` — credencial inválida. Mesma mensagem para e-mail
inexistente e senha errada, sem distinguir os dois.

> No semestre o login é local, com os três perfis. O ID-UFSC depende do
> SETIC/UFSC e fica como mock (`PEN-09`). O `RF-ACS-01` exige que o acesso
> administrativo local continue existindo mesmo depois do SSO — não é gambiarra
> temporária, é requisito.

### `DELETE /api/sessao` — logout
Autenticado. **204**, sem corpo, e o cookie é invalidado no servidor.

### `GET /api/sessao` — quem sou eu
Autenticado. **200** com o mesmo objeto `usuario` do login. **401** se não houver
sessão. É o que o front chama no boot para decidir se redireciona ao login.

---

## 4. Catálogo

### `GET /api/catalogo` — todos os dados de referência
Autenticado, qualquer perfil.

Uma chamada só, no boot. São dados de carga inicial que quase nunca mudam
(`RNF-05`, Anexo A dos requisitos). O front cacheia com `staleTime` longo.

**200**
```json
{
  "especies": [
    {
      "id": 1, "codigo": "rato", "nome": "Rato", "nomeCientifico": "Rattus norvegicus",
      "linhagens": [
        { "id": 1, "nome": "Wistar", "ativa": true },
        { "id": 2, "nome": "SHR", "ativa": true },
        { "id": 3, "nome": "Kyoto", "ativa": true }
      ]
    },
    {
      "id": 2, "codigo": "camundongo", "nome": "Camundongo", "nomeCientifico": "Mus musculus",
      "linhagens": [
        { "id": 4, "nome": "Swiss", "ativa": true },
        { "id": 5, "nome": "C57BL/6J", "ativa": true }
      ]
    }
  ],
  "salas": ["Sala 1", "Sala 2", "Sala 3"],
  "paresGeneticos": [
    { "grupoMacho": "A", "grupoFemea": "B" },
    { "grupoMacho": "B", "grupoFemea": "C" },
    { "grupoMacho": "C", "grupoFemea": "D" },
    { "grupoMacho": "D", "grupoFemea": "E" },
    { "grupoMacho": "E", "grupoFemea": "A" }
  ],
  "parametrosBiologicos": [
    {
      "idEspecie": 1, "idLinhagem": null,
      "gestacaoDias": 23, "aleitamentoDias": 22, "intervaloCicloDias": 6,
      "maxPartoCasal": 5, "expectativaM": 4, "expectativaF": 4,
      "dtVigenciaInicio": "2026-01-01", "dtVigenciaFim": null
    }
  ],
  "toleranciasIdade": [
    { "idadeMinDias": 21, "idadeMaxDias": 22, "variacaoDias": 1 },
    { "idadeMinDias": 23, "idadeMaxDias": 25, "variacaoDias": 2 },
    { "idadeMinDias": 26, "idadeMaxDias": 30, "variacaoDias": 3 },
    { "idadeMinDias": 31, "idadeMaxDias": 40, "variacaoDias": 4 },
    { "idadeMinDias": 41, "idadeMaxDias": 50, "variacaoDias": 5 },
    { "idadeMinDias": 51, "idadeMaxDias": 60, "variacaoDias": 7 },
    { "idadeMinDias": 61, "idadeMaxDias": 90, "variacaoDias": 10 },
    { "idadeMinDias": 91, "idadeMaxDias": null, "variacaoDias": 15 }
  ],
  "modelosEstante": [
    { "fabricante": "ALESCO", "modelo": "Modelo 1", "faces": 2, "linhas": 8, "colunas": 8, "capacidade": 128 },
    { "fabricante": "ALESCO", "modelo": "Modelo 2", "faces": 2, "linhas": 5, "colunas": 5, "capacidade": 50 },
    { "fabricante": "TECNIPLAST", "modelo": "Modelo 1", "faces": 2, "linhas": 8, "colunas": 7, "capacidade": 112 },
    { "fabricante": "TECNIPLAST", "modelo": "Modelo 2", "faces": 2, "linhas": 5, "colunas": 4, "capacidade": 40 }
  ]
}
```

> ⚠️ `idadeMaxDias: null` significa "sem teto" — é a faixa `> 90` da tabela do
> `RN-07`. O front não pode assumir que sempre há um máximo.

---

## 5. Infraestrutura

### `GET /api/estantes` — lista
Autenticado: **técnico, gestor**. Pesquisador recebe **403**.

Query opcional: `sala`, `especie` (`rato` | `camundongo`).

**200**
```json
{
  "estantes": [
    {
      "id": 3, "sala": "Sala 1", "fabricante": "ALESCO", "modelo": "Modelo 1",
      "numeroVisivel": "E-03",
      "topologia": { "faces": 2, "linhas": 8, "colunas": 8, "capacidade": 128 },
      "ocupacao": { "capacidade": 128, "ocupada": 91, "livre": 37 },
      "ativa": true
    }
  ]
}
```

`ocupacao` atende o `RF-INF-06` e é `capacidade − COUNT(caixa ativa)`.

### `GET /api/estantes/:id/grade` — a grade das duas faces
Autenticado: **técnico, gestor**.

**Este é o endpoint central do `RF-INF-03`** e o mais importante do MVP para o
front.

Regra que define o formato: **não existe tabela `slot`** (decisão D-04 do modelo
de dados). As posições vazias **são geradas pelo back-end** a partir da
topologia da estante e devolvidas com `caixa: null`. O front nunca gera grade;
ele desenha o que recebe.

**200**
```json
{
  "estante": {
    "id": 3, "sala": "Sala 1", "fabricante": "ALESCO", "modelo": "Modelo 1",
    "numeroVisivel": "E-03",
    "topologia": { "faces": 2, "linhas": 8, "colunas": 8, "capacidade": 128 }
  },
  "faces": [
    {
      "face": "frontal",
      "linhas": 8,
      "colunas": 8,
      "posicoes": [
        {
          "linha": 1, "coluna": 1, "codigo": "A1",
          "caixa": {
            "id": 812,
            "especie": "rato",
            "linhagem": "Wistar",
            "finalidade": "reproducao",
            "estado": "parcialmente_comprometida",
            "casal": { "id": 44, "identificacao": "AB", "cicloAtual": 3, "maxCiclos": 5 },
            "proximoEvento": { "tipo": "desmame_previsto", "data": "2026-09-21", "atrasado": false }
          }
        },
        { "linha": 1, "coluna": 2, "codigo": "A2", "caixa": null }
      ]
    },
    { "face": "traseira", "linhas": 8, "colunas": 8, "posicoes": [] }
  ]
}
```

- `posicoes` vem **completo**: `linhas × colunas` itens por face, na ordem
  linha-major (todas as colunas da linha 1, depois da linha 2…)
- `codigo` é o endereço como aparece na etiqueta física (`RF-INF-02`)
- `proximoEvento.tipo`: `parto_previsto` | `desmame_previsto` | `reacasalamento_liberado`
- `proximoEvento.atrasado: true` quando a data prevista passou sem confirmação.
  **É o alerta mais importante do `RF-REP-07`** — erosão silenciosa da
  confiabilidade dos dados. O front tem que fazer isso gritar

> ⚠️ **Bloqueado por `CONF-07`:** se a letra do `codigo` designa a linha ou a
> coluna ainda não está confirmado com o cliente. Enquanto isso, o back gera
> **letra = coluna, número = linha** (`A1` = coluna A, linha 1), que é o que a
> contagem do quadro de layouts sugere. A troca é uma linha na geração do código;
> nenhum dos dois lados deve espalhar essa suposição pelo resto do código.

### `POST /api/estantes` — cadastrar
**Gestor.** `RF-INF-01`: cadastrar modelo novo é operação de admin, **não deploy**.

```json
{
  "sala": "Sala 2", "fabricante": "ALESCO", "modelo": "Modelo 2",
  "numeroVisivel": "E-07", "faces": 2, "linhas": 5, "colunas": 5
}
```
**201** com o objeto da lista. `capacidade` é derivada (`faces × linhas × colunas`),
nunca enviada pelo cliente.

---

## 6. Ficha da posição

### `GET /api/caixas/:id` — ficha completa
Autenticado: **técnico, gestor**. `RF-INF-04` + `RF-REP-02`.

Abre do card da grade e do card do quadro — **a mesma ficha, a mesma fonte**
(`RF-CIC-02`: as duas visões nunca divergem).

**200**
```json
{
  "caixa": {
    "id": 812,
    "endereco": { "idEstante": 3, "numeroVisivel": "E-03", "sala": "Sala 1",
                  "face": "frontal", "linha": 1, "coluna": 1, "codigo": "A1" },
    "especie": "rato", "linhagem": "Wistar",
    "finalidade": "reproducao", "estado": "parcialmente_comprometida", "ativa": true
  },
  "casal": {
    "id": 44, "identificacao": "AB", "grupoMacho": "A", "grupoFemea": "B",
    "linhagem": "Wistar", "dtFormacao": "2026-05-02",
    "ativo": true, "cicloAtual": 3, "maxCiclos": 5,
    "dtEncerramento": null, "motivoEncerramento": null
  },
  "ciclos": [
    {
      "id": 501, "ordem": 1,
      "dtAcasalamento": "2026-05-02",
      "dtPartoPrevisto": "2026-05-25", "dtPartoReal": "2026-05-26",
      "nascidoM": 5, "nascidoF": 6,
      "dtSelecao": "2026-05-26", "eutanasiadoM": 1, "eutanasiadoF": 2,
      "dtDesmamePrevisto": "2026-06-17", "dtDesmameReal": "2026-06-18",
      "desmamadoM": 4, "desmamadoF": 4,
      "idCaixaRecria": null,
      "grauCerteza": "confirmado",
      "disponivel": { "m": 2, "f": 4 },
      "comprometido": { "m": 2, "f": 0 }
    }
  ],
  "eventos": [
    { "dataHora": "2026-06-18T13:02:00.000Z", "tipo": "desmame",
      "descricao": "Desmame registrado: 4 M, 4 F.", "autor": "Ana Souza" }
  ]
}
```

**Como o front lê `ciclos` (isto é requisito, não estética):**

- `RF-REP-02` — **datas previstas têm que ser visualmente distintas das reais.**
  A diferença entre "vai nascer" e "nasceu" é a informação mais importante da
  tela. O par `dtPartoPrevisto` / `dtPartoReal` existe para isso: `dtPartoReal
  === null` significa que ainda não aconteceu
- `disponivel` já vem **líquido**, com os compromissos descontados (`RN-09`).
  O front nunca subtrai nada: se subtrair, subtrai errado
- `grauCerteza` sai do `COALESCE` de três níveis do `RN-08`, calculado no
  servidor. Ver seção 5.1 do `modelo-de-dados.md`
- `ciclos` traz de 1 a 5 itens (`RN-04`), em ordem crescente de `ordem`

---

## 7. Reprodução

### `POST /api/casais` — formar casal
**Técnico, gestor.** `RF-REP-01`.

```json
{ "idCaixa": 812, "idLinhagem": 1, "grupoMacho": "A", "grupoFemea": "B",
  "dtFormacao": "2026-05-02" }
```

**201** com o objeto `casal` da ficha, já com o ciclo 1 criado e as datas
previstas calculadas (`RN-05` — a confirmação dispara a cadeia temporal).

Erros:
- **409** `PAR_GENETICO_INVALIDO` — par fora de AB/BC/CD/DE/EA (`RN-02`)
- **409** `CAIXA_JA_TEM_CASAL_ATIVO` — `RN-03`
- **400** `VALIDACAO` — linhagem que não pertence à espécie da caixa

### `POST /api/partos/:id/nascimento` — registrar parto
**Técnico, gestor.** `RF-REP-03`.

```json
{ "dtPartoReal": "2026-05-26", "nascidoM": 5, "nascidoF": 6 }
```

**200** com o ciclo atualizado **e os ciclos seguintes recalculados** — confirmar
um parto real recalcula toda a cadeia à frente (`RN-05`). A oferta passa de
`projetado` para `previsto`.

- **409** `LIMITE_PARTOS_ATINGIDO` — `RN-04`
- **409** `SEQUENCIA_INVALIDA` — parto do ciclo *n* antes do ciclo *n−1*

### `POST /api/partos/:id/selecao` — eutanásia de seleção
**Técnico, gestor.** `RF-REP-04`.

```json
{ "dtSelecao": "2026-05-26", "eutanasiadoM": 1, "eutanasiadoF": 2 }
```

**200** com o ciclo atualizado e a disponibilidade recalculada.

> **Não impor limite máximo.** O `RF-REP-04` é explícito: quem decide quantos
> permanecem é o técnico, pelo protocolo. A única validação é
> `eutanasiado ≤ nascido` por sexo. Isso conflita com a constante de 4M/4F
> (`CONF-03`, `PEN-05`) — a constante é só a **expectativa** de ninhada não
> nascida, nunca um teto.

### `POST /api/partos/:id/desmame` — registrar desmame
**Técnico, gestor.** `RF-REP-05`.

```json
{ "dtDesmameReal": "2026-06-18", "desmamadoM": 4, "desmamadoF": 4,
  "idCaixaRecria": null }
```

**200** com o ciclo atualizado. A partir daqui o estoque é `confirmado`.

> `idCaixaRecria` é **anulável de propósito** (decisão D-03, `PEN-02` em aberto):
> nulo = os desmamados seguem na caixa do casal; preenchido = mudaram para caixa
> própria. Nenhuma das duas respostas do cliente quebra o modelo. Enquanto a
> pendência não fecha, o front pode não expor o campo.

### `POST /api/casais/:id/encerramento` — encerrar casal
**Técnico, gestor.** `RF-REP-08`.

```json
{ "dtEncerramento": "2026-10-01", "motivo": "5º parto concluído" }
```
**200**. `RNF-06`: **nada é apagado.** O casal encerra, não some, e a caixa fica
livre para novo casal.

---

## 8. Quadro de acompanhamento

### `GET /api/quadro?especie=rato` — as 5 colunas
**Técnico, gestor.** `especie` é **obrigatório**.

`RF-CIC-01`: um quadro por espécie, sem mistura, com a **segregação aplicada no
servidor**. Não é filtro de interface — o front pede uma espécie e recebe só ela.

Query opcional: `linhagem`, `sala`, `dtPrevistaDe`, `dtPrevistaAte` (`RF-CIC-05`).

**200**
```json
{
  "especie": "rato",
  "colunas": [
    {
      "estado": "em_reproducao",
      "total": 34,
      "cards": [
        {
          "idCaixa": 812, "codigo": "A1", "numeroVisivel": "E-03", "sala": "Sala 1",
          "linhagem": "Wistar",
          "casal": { "identificacao": "AB", "cicloAtual": 3, "maxCiclos": 5 },
          "disponivel": { "m": 2, "f": 4 },
          "grauCerteza": "previsto",
          "proximoEvento": { "tipo": "desmame_previsto", "data": "2026-09-21", "atrasado": false }
        }
      ]
    }
  ]
}
```

As cinco colunas vêm **sempre**, na ordem de `COLUNAS_DO_QUADRO`
(`front-end/src/dominio/estados.ts`), mesmo vazias — o front não inventa coluna
nem reordena.

`cicloAtual` no card atende o `RF-CIC-04`: o ciclo (1º a 5º) muda a leitura de
risco da oferta e precisa estar visível, com legenda e não só cor.

### `PATCH /api/caixas/:id/estado` — mover entre colunas
**Técnico, gestor.** `RF-CIC-03`.

```json
{ "estado": "preparada_para_envio", "justificativa": null, "confirmar": false }
```

**Transição é livre, inclusive retrocedendo.** Toda transição registra autor,
data, origem e destino.

- **200** quando a transição não contraria compromisso
- **409** `TRANSICAO_CONTRARIA_COMPROMISSO` quando contraria. A resposta descreve
  o que será quebrado; o front mostra ao usuário e reenvia com `confirmar: true`,
  e aí a transição é gravada **como exceção**:

```json
{
  "erro": {
    "codigo": "TRANSICAO_CONTRARIA_COMPROMISSO",
    "mensagem": "Esta caixa tem 2 machos comprometidos com a remessa #17 (projeto 23080.001234/2026-11). Confirmar mesmo assim?",
    "requisito": "RF-CIC-03",
    "compromissosAfetados": [
      { "idRemessa": 17, "projeto": "23080.001234/2026-11", "qtdM": 2, "qtdF": 0 }
    ]
  }
}
```

> Este 409-com-confirmação é o motivo de o drag-and-drop **não** poder aplicar a
> transição direto no drop. Para a N2, um botão "mover para" no card entrega o
> mesmo comportamento com menos risco; o `@dnd-kit` entra depois (ver
> `decisoes-de-stack.md`).

---

## 9. Healthcheck

### `GET /saude`
Público, **fora de `/api`**. Usado pela Render e pelo front para detectar que a
API está acordando.

**200** `{ "status": "ok", "ambiente": "producao", "versao": "0.1.0" }`

> O free tier da Render dorme após ~15 min de inatividade e leva de 30s a 1min
> para acordar. O front deve tratar a primeira requisição lenta como normal, com
> aviso na tela, e não como erro.

---

## 10. O que ainda não está neste contrato

O MVP até a N2 (24/09) é o que está acima. Entra depois, e **só depois de
acrescentado aqui**:

| Área | Requisitos | Bloqueado por |
|---|---|---|
| Projetos de ética e cota | `RF-DEM-06` | `PEN-10` |
| Solicitação e aprovação | `RF-DEM-01` a `RF-DEM-05` | `PEN-11` |
| Motor de atendimento | `RF-MOT-01` a `RF-MOT-09` | `CONF-01`, `CONF-06` |
| Compromissos e alocação | `RF-MOT-08`, `RN-09` | — |
| Agrupamento e expedição | `RF-EXP-01` a `RF-EXP-05` | `PEN-08` |
| Insumos | `RF-INS-01` a `RF-INS-04` | `PEN-08` |
| Indicadores e auditoria | `RF-BI-01` a `RF-BI-05` | — |

---

*Contrato de API Nidus · v1.0 · 03/09/2026 · idêntico em `nidus-back-end/docs/` e `nidus-front-end/docs/`*
