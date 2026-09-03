/**
 * Tema do Ant Design.
 *
 * Contraste e alvo de toque não são preferência de design aqui: o `RNF-03` diz
 * que o registro de parto, seleção e desmame acontece **dentro da sala, com o
 * técnico de luvas e paramentado** — tela pequena, alvo de toque generoso,
 * mínimo de digitação. E o `RNF-10` pede contraste adequado.
 */
import type { ThemeConfig } from 'antd'

export const tema: ThemeConfig = {
  token: {
    colorPrimary: '#164132',
    borderRadius: 6,
    fontSize: 15,
    /** Padrão do Ant Design é 32px. 40 é o mínimo confortável com luva. */
    controlHeight: 40,
  },
  components: {
    Button: { controlHeight: 40 },
    Input: { controlHeight: 40 },
    Select: { controlHeight: 40 },
    DatePicker: { controlHeight: 40 },
    InputNumber: { controlHeight: 40 },
    Table: { cellPaddingBlock: 12 },
  },
}
