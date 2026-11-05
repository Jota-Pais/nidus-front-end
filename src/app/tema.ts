// Tema do Ant Design, derivado dos tokens do design system
import type { ThemeConfig } from 'antd'
import { HOVER, misturar, PRESSIONADO } from './cor'
import {
  ALTURA_DE_CONTROLE,
  COR,
  COR_DE_RETORNO,
  FONTE,
  MOVIMENTO,
  RAIO,
  SOMBRA,
  SUPERFICIE_DE_RETORNO,
  TAMANHO_DE_FONTE,
} from './tokens'

export const tema: ThemeConfig = {
  token: {
    /**
     * A família da ação inteira, e não só a semente: com só o `colorPrimary`, o Ant Design
     * deriva os tons com a conta dele, e o item ativo do menu saía num cinza-azulado que não
     * estava na paleta
     */
    colorPrimary: COR.acao,
    colorPrimaryHover: COR.acaoHover,
    colorPrimaryActive: COR.acaoPressionada,
    colorPrimaryBg: COR.acaoFundo,
    colorPrimaryBgHover: COR.acaoFundoHover,
    colorPrimaryBorder: COR.acaoBorda,
    colorPrimaryBorderHover: COR.acaoHover,
    colorPrimaryText: COR.acao,
    colorPrimaryTextHover: COR.acaoHover,
    colorPrimaryTextActive: COR.acaoPressionada,
    colorLink: COR.acao,
    colorLinkHover: COR.acaoHover,
    colorLinkActive: COR.acaoPressionada,
    controlItemBgActive: COR.acaoFundo,
    controlItemBgActiveHover: COR.acaoFundoHover,

    /** Informação é a própria ação, com a mesma família */
    colorInfo: COR_DE_RETORNO.informacao,
    colorInfoHover: COR.acaoHover,
    colorInfoActive: COR.acaoPressionada,
    colorInfoBgHover: COR.acaoFundoHover,
    colorInfoBorderHover: COR.acaoHover,
    colorInfoText: COR.acao,
    colorInfoTextHover: COR.acaoHover,
    colorInfoTextActive: COR.acaoPressionada,

    colorSuccess: COR_DE_RETORNO.sucesso,
    colorWarning: COR_DE_RETORNO.aviso,
    colorError: COR_DE_RETORNO.erro,
    /** O botão de perigo é cheio como o primário, e passa o mouse e clica pela mesma regra */
    colorErrorHover: misturar(COR.acaoFrente, COR_DE_RETORNO.erro, HOVER),
    colorErrorActive: misturar(COR.acaoFrente, COR_DE_RETORNO.erro, PRESSIONADO),

    /** superfície e contorno de cada tom, explícitos. */
    colorSuccessBg: SUPERFICIE_DE_RETORNO.sucessoFundo,
    colorSuccessBorder: SUPERFICIE_DE_RETORNO.sucessoBorda,
    colorWarningBg: SUPERFICIE_DE_RETORNO.avisoFundo,
    colorWarningBorder: SUPERFICIE_DE_RETORNO.avisoBorda,
    colorErrorBg: SUPERFICIE_DE_RETORNO.erroFundo,
    colorErrorBorder: SUPERFICIE_DE_RETORNO.erroBorda,
    colorInfoBg: SUPERFICIE_DE_RETORNO.informacaoFundo,
    colorInfoBorder: SUPERFICIE_DE_RETORNO.informacaoBorda,

    colorBgLayout: COR.fundo,
    colorBgContainer: COR.cartao,
    colorBorder: COR.borda,
    colorBorderSecondary: COR.borda,
    colorText: COR.frente,
    colorTextSecondary: COR.suaveFrente,
    colorTextTertiary: COR.suaveFrente,
    colorTextDescription: COR.suaveFrente,
    colorFillTertiary: COR.suave,

    fontFamily: FONTE.interface,
    fontFamilyCode: FONTE.mono,
    fontSize: TAMANHO_DE_FONTE,

    borderRadius: RAIO.md,
    borderRadiusLG: RAIO.lg,
    borderRadiusSM: RAIO.sm,

    boxShadow: SOMBRA.md,
    boxShadowSecondary: SOMBRA.lg,

    controlHeight: ALTURA_DE_CONTROLE,

    /** O halo de foco dos campos, em volta da borda na cor de ação */
    controlOutline: COR.acaoBorda,
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
    Table: { cellPaddingBlock: 14, headerBg: COR.suave, headerColor: COR.suaveFrente },
    Layout: { headerBg: COR.marca, bodyBg: COR.fundo, siderBg: COR.cartao },
    Menu: { itemBorderRadius: RAIO.sm, itemMarginInline: 8 },
    Modal: { borderRadiusLG: RAIO.lg },
  },
}
