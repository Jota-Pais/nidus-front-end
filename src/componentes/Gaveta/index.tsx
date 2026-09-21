import { Drawer } from 'antd'
import type { DrawerProps } from 'antd'
import type { ReactNode } from 'react'

/** painel lateral */
export function Gaveta({
  titulo,
  aberta,
  aoFechar,
  children,
  rodape,
  largura = 480,
  ...props
}: Omit<DrawerProps, 'open' | 'onClose' | 'title' | 'footer' | 'width'> & {
  titulo: ReactNode
  aberta: boolean
  aoFechar: () => void
  children: ReactNode
  rodape?: ReactNode
  largura?: number
}) {
  return (
    <Drawer
      title={titulo}
      open={aberta}
      onClose={aoFechar}
      width={largura}
      styles={{ body: { paddingBlock: 20 } }}
      {...(rodape === undefined ? {} : { footer: rodape })}
      className="gaveta"
      destroyOnHidden
      {...props}
    >
      {children}
    </Drawer>
  )
}
