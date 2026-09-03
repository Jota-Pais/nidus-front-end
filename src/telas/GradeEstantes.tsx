import { Card, Space, Typography } from 'antd'
import { Legenda } from '@/dominio/Legenda'
import { MODELOS_ESTANTE, faixaDeLetras } from '@/fixtures/estantes'
import { EmConstrucao } from './EmConstrucao'

export function GradeEstantes() {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <EmConstrucao
        titulo="Grade de estantes"
        ator="Técnico"
        requisitos={['RF-INF-03', 'RF-INF-06', 'RNF-10']}
        descricao="Reproduz a estante real com as duas faces visíveis ao mesmo tempo, comunicando de relance: vazia, com casal, estágio do ciclo e situação de comprometimento. Um card por caixa, clicável, abrindo a ficha da posição."
        atencao="A codificação não pode depender só de cor — a legenda abaixo já é o segundo canal, e é a mesma do quadro e da ficha."
      />

      <Card size="small" title="Legenda compartilhada (RNF-10)">
        <Legenda />
      </Card>

      <Card size="small" title="Topologias de carga inicial (Anexo A.2)">
        <Space direction="vertical" size={4}>
          {MODELOS_ESTANTE.map((modelo) => {
            const [inicioFrontal, fimFrontal] = faixaDeLetras(modelo, 'frontal')
            const [inicioTraseira, fimTraseira] = faixaDeLetras(modelo, 'traseira')
            return (
              <Typography.Text key={modelo.id}>
                <strong>
                  {modelo.fabricante} {modelo.nome}
                </strong>{' '}
                — {modelo.capacidade} posições · {modelo.linhas}L × {modelo.colunas}C · frontal{' '}
                {inicioFrontal}–{fimFrontal} · traseira {inicioTraseira}–{fimTraseira}
              </Typography.Text>
            )
          })}
        </Space>
      </Card>
    </Space>
  )
}
