import { Card, Space, Tag, Typography } from 'antd'

/**
 * Placeholder de tela.
 *
 * A casca existe e a rota funciona; o conteúdo de cada tela é um card próprio no
 * backlog do Trello. Isto deixa o requisito à vista de quem for pegar o card, em
 * vez de deixar a rota vazia.
 */
export function EmConstrucao({
  titulo,
  ator,
  requisitos,
  descricao,
  atencao,
}: {
  titulo: string
  ator: string
  requisitos: string[]
  descricao: string
  atencao?: string
}) {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          {titulo}
        </Typography.Title>
        <Space size={[6, 6]} wrap>
          <Tag>Ator: {ator}</Tag>
          {requisitos.map((r) => (
            <Tag key={r} color="blue">
              {r}
            </Tag>
          ))}
        </Space>
      </div>

      <Card size="small" title="O que esta tela precisa fazer">
        <Typography.Paragraph style={{ marginBottom: atencao ? 12 : 0 }}>
          {descricao}
        </Typography.Paragraph>
        {atencao && <Typography.Text type="warning">⚠️ {atencao}</Typography.Text>}
      </Card>

      <Typography.Text type="secondary">
        Card no backlog do Trello. A casca, o tema, a legenda de estado e a formatação de data já
        estão prontos — esta tela consome, não reimplementa.
      </Typography.Text>
    </Space>
  )
}
