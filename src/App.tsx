import { QueryClientProvider } from '@tanstack/react-query'
import { App as AntApp, ConfigProvider } from 'antd'
import ptBR from 'antd/locale/pt_BR'
import { useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { criarQueryClient } from '@/app/queryClient'
import { rotas } from '@/app/rotas'
import { tema, temaEstreito } from '@/app/tema'
import { ProvedorDePerfil } from '@/auth/ProvedorDePerfil'
import { useTelaEstreita } from '@/layout/useTelaEstreita'

export function App() {
  // Criado uma vez, no estado: criar no corpo do componente faria um
  // cliente novo a cada render e o cache seria descartado junto
  const [queryClient] = useState(criarQueryClient)
  // No celular, as peças pequenas crescem para o dedo; no computador, o tema de sempre
  const estreita = useTelaEstreita()

  return (
    <ConfigProvider locale={ptBR} theme={estreita ? temaEstreito : tema}>
      <AntApp>
        <QueryClientProvider client={queryClient}>
          <ProvedorDePerfil>
            <RouterProvider router={rotas} />
          </ProvedorDePerfil>
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  )
}
