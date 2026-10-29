// Tema do Ant Design, derivado dos tokens do design system
import type { ThemeConfig } from 'antd'
import {
  ALTURA_DE_CONTROLE,
  COR,
  COR_DE_RETORNO,
  FONTE,
  RAIO,
  SOMBRA,
  SUPERFICIE_DE_RETORNO,
  TAMANHO_DE_FONTE,
} from './tokens'

export const tema: ThemeConfig = {
  token: {
    colorPrimary: COR.acento,
    colorInfo: COR_DE_RETORNO.informacao,
    colorSuccess: COR_DE_RETORNO.sucesso,
    colorWarning: COR_DE_RETORNO.aviso,
    colorError: COR_DE_RETORNO.erro,

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
    colorLink: COR.acento,
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

    /** anel de foco no azul institucional, como o design system pede */
    controlOutline: `color-mix(in srgb, ${COR.acento} 20%, transparent)`,
    controlOutlineWidth: 3,

    /** A curva do design system: sai rápido, assenta devagar. */
    motionEaseInOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    motionEaseOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
  components: {
    Button: { controlHeight: ALTURA_DE_CONTROLE, fontWeight: 500, primaryShadow: 'none' },
    Input: { controlHeight: ALTURA_DE_CONTROLE },
    InputNumber: { controlHeight: ALTURA_DE_CONTROLE },
    Select: { controlHeight: ALTURA_DE_CONTROLE },
    Table: { cellPaddingBlock: 14, headerBg: COR.suave, headerColor: COR.suaveFrente },
    Layout: { headerBg: COR.invertido, bodyBg: COR.fundo, siderBg: COR.cartao },
    Menu: { itemBorderRadius: RAIO.sm, itemMarginInline: 8 },
    Modal: { borderRadiusLG: RAIO.lg },
  },
}
