import { Flex, Spin } from 'antd'

/** Estado de carregamento padronizado. Nenhuma tela inventa o seu. */
export function Carregando({ rotulo = 'Carregando…' }: { rotulo?: string }) {
  return (
    <Flex align="center" justify="center" style={{ minHeight: 240 }}>
      <Spin tip={rotulo} size="large">
        <div style={{ padding: 24 }} />
      </Spin>
    </Flex>
  )
}
