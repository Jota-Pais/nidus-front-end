// Tema do Ant Design, derivado dos tokens do design system
import { theme as antd } from 'antd'
import type { ThemeConfig } from 'antd'
import type { Esquema } from './esquema'
import { HOVER, misturar, PRESSIONADO } from './cor'
import {
  ALTURA_DE_CONTROLE,
  COR,
  COR_DE_RETORNO,
  COR_DE_RETORNO_ESCURO,
  COR_ESCURO,
  FONTE,
  MOVIMENTO,
  RAIO,
  SOMBRA,
  SOMBRA_ESCURO,
  SUPERFICIE_DE_RETORNO,
  SUPERFICIE_DE_RETORNO_ESCURO,
  TAMANHO_DE_FONTE,
} from './tokens'

/** As cores de um esquema, na mesma forma nos dois: o tema do Ant Design é escrito uma vez só */
interface Paleta {
  cor: Record<keyof typeof COR, string>
  retorno: Record<keyof typeof COR_DE_RETORNO, string>
  superficie: Record<keyof typeof SUPERFICIE_DE_RETORNO, string>
  sombra: Record<keyof typeof SOMBRA, string>
}

const CLARA: Paleta = {
  cor: COR,
  retorno: COR_DE_RETORNO,
  superficie: SUPERFICIE_DE_RETORNO,
  sombra: SOMBRA,
}

const ESCURA: Paleta = {
  cor: COR_ESCURO,
  retorno: COR_DE_RETORNO_ESCURO,
  superficie: SUPERFICIE_DE_RETORNO_ESCURO,
  sombra: SOMBRA_ESCURO,
}

/**
 * No escuro o algoritmo escuro do Ant Design faz a base (fundos de cada camada, preenchimentos,
 * texto desabilitado) e os tokens da paleta, abaixo, valem por cima dele: o mesmo conjunto serve
 * aos dois esquemas, e só a paleta muda.
 */
function criarTema({ cor, retorno, superficie, sombra }: Paleta, escuro: boolean): ThemeConfig {
  return {
    ...(escuro ? { algorithm: antd.darkAlgorithm } : {}),
    token: {
      /**
       * A família da ação inteira, e não só a semente: com só o `colorPrimary`, o Ant Design
       * deriva os tons com a conta dele, e o item ativo do menu saía num cinza-azulado que não
       * estava na paleta
       */
      colorPrimary: cor.acao,
      colorPrimaryHover: cor.acaoHover,
      colorPrimaryActive: cor.acaoPressionada,
      colorPrimaryBg: cor.acaoFundo,
      colorPrimaryBgHover: cor.acaoFundoHover,
      colorPrimaryBorder: cor.acaoBorda,
      colorPrimaryBorderHover: cor.acaoHover,
      colorPrimaryText: cor.acao,
      colorPrimaryTextHover: cor.acaoHover,
      colorPrimaryTextActive: cor.acaoPressionada,
      colorLink: cor.acao,
      colorLinkHover: cor.acaoHover,
      colorLinkActive: cor.acaoPressionada,
      controlItemBgActive: cor.acaoFundo,
      controlItemBgActiveHover: cor.acaoFundoHover,

      /** Informação é a própria ação, com a mesma família */
      colorInfo: retorno.informacao,
      colorInfoHover: cor.acaoHover,
      colorInfoActive: cor.acaoPressionada,
      colorInfoBgHover: cor.acaoFundoHover,
      colorInfoBorderHover: cor.acaoHover,
      colorInfoText: cor.acao,
      colorInfoTextHover: cor.acaoHover,
      colorInfoTextActive: cor.acaoPressionada,

      colorSuccess: retorno.sucesso,
      colorWarning: retorno.aviso,
      colorError: retorno.erro,
      /** O botão de perigo é cheio como o primário, e passa o mouse e clica pela mesma regra */
      colorErrorHover: misturar(cor.acaoFrente, retorno.erro, HOVER),
      colorErrorActive: misturar(cor.acaoFrente, retorno.erro, PRESSIONADO),

      /** superfície e contorno de cada tom, explícitos. */
      colorSuccessBg: superficie.sucessoFundo,
      colorSuccessBorder: superficie.sucessoBorda,
      colorWarningBg: superficie.avisoFundo,
      colorWarningBorder: superficie.avisoBorda,
      colorErrorBg: superficie.erroFundo,
      colorErrorBorder: superficie.erroBorda,
      colorInfoBg: superficie.informacaoFundo,
      colorInfoBorder: superficie.informacaoBorda,

      colorBgLayout: cor.fundo,
      colorBgContainer: cor.cartao,
      /** Menu suspenso, janela e dica: a superfície do cartão, no escuro também */
      colorBgElevated: cor.cartao,
      colorBorder: cor.borda,
      colorBorderSecondary: cor.borda,
      colorText: cor.frente,
      /** Texto sobre botão cheio (primário e de perigo): o da própria cor de ação, escuro no escuro */
      colorTextLightSolid: cor.acaoFrente,
      colorTextSecondary: cor.suaveFrente,
      colorTextTertiary: cor.suaveFrente,
      colorTextDescription: cor.suaveFrente,
      colorFillTertiary: cor.suave,

      fontFamily: FONTE.interface,
      fontFamilyCode: FONTE.mono,
      fontSize: TAMANHO_DE_FONTE,

      borderRadius: RAIO.md,
      borderRadiusLG: RAIO.lg,
      borderRadiusSM: RAIO.sm,

      boxShadow: sombra.md,
      boxShadowSecondary: sombra.lg,

      controlHeight: ALTURA_DE_CONTROLE,

      /** O halo de foco dos campos, em volta da borda na cor de ação */
      controlOutline: cor.acaoBorda,
      controlOutlineWidth: 3,

      /** A curva do design system: sai rápido, assenta devagar. */
      motionEaseInOut: MOVIMENTO.curva,
      motionEaseOut: MOVIMENTO.curva,
    },
    components: {
      Button: { controlHeight: ALTURA_DE_CONTROLE, fontWeight: 500, primaryShadow: 'none' },
      Input: { controlHeight: ALTURA_DE_CONTROLE },
      InputNumber: { controlHeight: ALTURA_DE_CONTROLE },
      Select: { controlHeight: ALTURA_DE_CONTROLE },
      /**
       * O campo tem a altura dos outros, mas o calendário não: o Ant Design tira o tamanho de
       * cada dia da altura de controle, e com 48 o calendário dobrava de tamanho
       */
      DatePicker: {
        controlHeight: ALTURA_DE_CONTROLE,
        cellHeight: 28,
        // com a fonte de 16, "Dom Seg Ter" encostam abaixo de 40
        cellWidth: 40,
        textHeight: 40,
        withoutTimeCellHeight: 56,
      },
      /**
       * A coluna que ordena não ganha fundo próprio, nem no cabeçalho nem nas linhas: quem mostra
       * a ordem são as setas. O cabeçalho que ordena escurece um pouco com o mouse
       */
      Table: {
        cellPaddingBlock: 14,
        headerBg: cor.suave,
        headerColor: cor.suaveFrente,
        headerSortActiveBg: cor.suave,
        headerSortHoverBg: misturar(cor.suaveFrente, cor.suave, HOVER),
        bodySortBg: cor.cartao,
      },
      Layout: {
        headerBg: cor.marca,
        bodyBg: cor.fundo,
        siderBg: cor.cartao,
        lightSiderBg: cor.cartao,
      },
      Menu: { itemBorderRadius: RAIO.sm, itemMarginInline: 8 },
      Modal: { borderRadiusLG: RAIO.lg },
    },
  }
}

/**
 * O tema do celular, abaixo de 768 px (ver `useTelaEstreita`). O do computador já tem campos e
 * botões de 48 px com fonte de 16, que é tamanho de toque e não faz o iPhone dar zoom no campo;
 * aqui crescem só as peças pequenas, a caixinha de marcar, o rádio e os dias do calendário, e a
 * tabela perde respiro dos lados
 */
function comTelaEstreita(base: ThemeConfig): ThemeConfig {
  return {
    ...base,
    token: { ...base.token, controlInteractiveSize: 20 },
    components: {
      ...base.components,
      DatePicker: { ...base.components?.DatePicker, cellHeight: 36 },
      Table: { ...base.components?.Table, cellPaddingInline: 12, cellPaddingBlock: 12 },
    },
  }
}

export const tema: ThemeConfig = criarTema(CLARA, false)
export const temaEscuro: ThemeConfig = criarTema(ESCURA, true)
export const temaEstreito: ThemeConfig = comTelaEstreita(tema)
export const temaEscuroEstreito: ThemeConfig = comTelaEstreita(temaEscuro)

/** O tema do Ant Design para o esquema escolhido e o tamanho da tela */
export function temaDo(esquema: Esquema, estreita: boolean): ThemeConfig {
  if (esquema === 'escuro') return estreita ? temaEscuroEstreito : temaEscuro
  return estreita ? temaEstreito : tema
}
