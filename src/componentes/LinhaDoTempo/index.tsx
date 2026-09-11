import { Timeline, Typography } from 'antd'
import dayjs from 'dayjs'
import type { EventoDeAuditoria } from '@/dominio/ficha'
import { Vazio } from '../Vazio'

/**
 * Trilha de auditoria da ficha — `RNF-06`.
 *
 * "Nada é apagado": correção entra como evento novo, não como sobrescrita. É
 * por isso que a lista é cronológica e mostra **autor**. Sem o autor, a trilha
 * responde "o que mudou" e não responde "quem mudou", que é a metade que
 * importa quando um número não bate.
 *
 * Hora com minuto, e não só a data: dois registros do mesmo dia precisam ter
 * ordem visível. Este é o único lugar do front que formata hora — o `RNF-04`
 * fala de data (`dd/mm/aaaa`) e `@/lib/data` cuida dela; `dataHora` é
 * carimbo de auditoria, ISO 8601 completo, outra coisa.
 */
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
