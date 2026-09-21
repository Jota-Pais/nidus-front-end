import { Timeline, Typography } from 'antd'
import dayjs from 'dayjs'
import type { EventoDeAuditoria } from '@/dominio/ficha'
import { Vazio } from '../Vazio'

/** trilha de auditoria da ficha - RNF-06. */
export function LinhaDoTempo({ eventos }: { eventos: EventoDeAuditoria[] }) {
  if (eventos.length === 0) {
    return <Vazio descricao="Nenhum evento registrado nesta caixa ainda." />
  }

  return (
    <Timeline
      items={eventos.map((evento, indice) => ({
        key: `${evento.dataHora}-${indice}`,
        children: (
          <div>
            <Typography.Text strong>{evento.descricao}</Typography.Text>
            <br />
            <Typography.Text type="secondary">
              <time dateTime={evento.dataHora}>
                {dayjs(evento.dataHora).format('DD/MM/YYYY [às] HH:mm')}
              </time>
              {' · '}
              {evento.autor}
            </Typography.Text>
          </div>
        ),
      }))}
    />
  )
}
