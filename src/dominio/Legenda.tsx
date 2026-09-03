import { Space, Tag, Tooltip, Typography } from 'antd'
import { COLUNAS_DO_QUADRO, ESTADO_CAIXA, GRAU_CERTEZA, ORDEM_GRAU_CERTEZA } from './estados'
import type { CodificacaoVisual } from './estados'
import type { EstadoCaixa, GrauCerteza } from './tipos'

/**
 * `RNF-10` — a legenda compartilhada por grade, quadro e ficha.
 *
 * Uma legenda só, não três. Cada marca leva cor **e** marcador **e** sigla, de
 * forma que a informação sobreviva a daltonismo, leitor de tela e impressão em
 * preto e branco.
 */

function Marca({ visual, titulo }: { visual: CodificacaoVisual; titulo?: string }) {
  return (
    <Tooltip title={visual.descricao}>
      <Tag color={visual.cor} aria-label={`${titulo ?? visual.rotulo}: ${visual.descricao}`}>
        <span aria-hidden="true">{visual.marcador}</span> {visual.sigla}
      </Tag>
    </Tooltip>
  )
}

export function MarcaEstadoCaixa({ estado }: { estado: EstadoCaixa }) {
  return <Marca visual={ESTADO_CAIXA[estado]} />
}

export function MarcaGrauCerteza({ grau }: { grau: GrauCerteza }) {
  return <Marca visual={GRAU_CERTEZA[grau]} />
}

export function Legenda() {
  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <div>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
          Estado da caixa
        </Typography.Text>
        <Space size={[8, 8]} wrap>
          {COLUNAS_DO_QUADRO.map((estado) => (
            <Space key={estado} size={4}>
              <MarcaEstadoCaixa estado={estado} />
              <Typography.Text>{ESTADO_CAIXA[estado].rotulo}</Typography.Text>
            </Space>
          ))}
        </Space>
      </div>

      <div>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
          Grau de certeza da oferta
        </Typography.Text>
        <Space size={[8, 8]} wrap>
          {ORDEM_GRAU_CERTEZA.map((grau) => (
            <Space key={grau} size={4}>
              <MarcaGrauCerteza grau={grau} />
              <Typography.Text>{GRAU_CERTEZA[grau].rotulo}</Typography.Text>
            </Space>
          ))}
        </Space>
      </div>
    </Space>
  )
}
