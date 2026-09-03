import { App as AntApp, ConfigProvider } from 'antd'
import ptBR from 'antd/locale/pt_BR'
import { RouterProvider } from 'react-router-dom'
import { rotas } from '@/app/rotas'
import { tema } from '@/app/tema'
import { ProvedorDePerfil } from '@/auth/ProvedorDePerfil'

export function App() {
  return (
    <ConfigProvider locale={ptBR} theme={tema}>
      <AntApp>
        <ProvedorDePerfil>
          <RouterProvider router={rotas} />
        </ProvedorDePerfil>
      </AntApp>
    </ConfigProvider>
  )
}
