/**
 * Tema do Ant Design, derivado dos tokens do design system.
 *
 * ⚠️ **Nenhum valor literal aqui.** Tudo vem de `@/app/tokens`, que é o mesmo
 * lugar de onde sai `tokens.css`. Escrever `#003893` neste arquivo cria a
 * terceira cópia do azul institucional, e é a que ninguém lembra de atualizar.
 *
 * Duas coisas que este arquivo carrega e não são preferência de design:
 *
 * - **`RNF-03`** — o registro de parto, seleção e desmame acontece dentro da
 *   sala, com o técnico de luvas e paramentado: tela pequena, alvo de toque
 *   generoso, mínimo de digitação. Daí `ALTURA_DE_CONTROLE`.
 * - **`RNF-10`** — contraste adequado, e nada só por cor. O contraste está na
 *   paleta; o "nada só por cor" está em `@/dominio/estados`.
 */
import type { ThemeConfig } from 'antd'
import {
  ALTURA_DE_CONTROLE,
  COR,
  COR_DE_RETORNO,
  FONTE,
  RAIO,
  SOMBRA,
  TAMANHO_DE_FONTE,
} from './tokens'

export const tema: ThemeConfig = {
  token: {
    colorPrimary: COR.acento,
    colorInfo: COR_DE_RETORNO.informacao,
    colorSuccess: COR_DE_RETORNO.sucesso,
    colorWarning: COR_DE_RETORNO.aviso,
    colorError: COR_DE_RETORNO.erro,

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

    /** Anel de foco no azul institucional — o design system e o `RNF-10` pedem o mesmo. */
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
    DatePicker: { controlHeight: ALTURA_DE_CONTROLE },
    Table: { cellPaddingBlock: 14, headerBg: COR.suave, headerColor: COR.suaveFrente },
    Card: { boxShadowTertiary: SOMBRA.md },
    Layout: { headerBg: COR.invertido, bodyBg: COR.fundo, siderBg: COR.cartao },
    Menu: { itemBorderRadius: RAIO.sm, itemMarginInline: 8 },
    /** `Calistoga` só em título; o resto da tela é `Inter`. */
    Typography: { fontWeightStrong: 600 },
    Modal: { borderRadiusLG: RAIO.lg },
    Tag: { borderRadiusSM: RAIO.sm },
  },
}
