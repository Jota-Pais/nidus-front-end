import { createContext, useContext } from 'react'

export const AbrirFicha = createContext<((idCaixa: number) => void) | null>(null)

export function useAbrirFicha(): ((idCaixa: number) => void) | null {
  return useContext(AbrirFicha)
}
