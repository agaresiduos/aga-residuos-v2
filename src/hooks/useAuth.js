import { useState, useEffect } from 'react'
import { getMotoristaPorPin } from '../lib/supabase'

const PIN_GESTOR = import.meta.env.VITE_PIN_GESTOR || '1234'
const SESSION_KEY = 'aga_session'

export function useAuth() {
  const [usuario, setUsuario] = useState(null)  // { id, nome, pin, cor, perfil: 'gestor'|'motorista' }
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  // Restaurar sessão do localStorage
  useEffect(() => {
    const salvo = localStorage.getItem(SESSION_KEY)
    if (salvo) {
      try {
        setUsuario(JSON.parse(salvo))
      } catch {}
    }
    setCarregando(false)
  }, [])

  const login = async (pin) => {
    setErro(null)

    // PIN do gestor (fixo no .env)
    if (pin === PIN_GESTOR) {
      const sessao = { id: 'gestor', nome: 'Gestor', pin, cor: '#1b3a6b', perfil: 'gestor' }
      setUsuario(sessao)
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessao))
      return { ok: true }
    }

    // PIN de motorista (busca no banco)
    const motorista = await getMotoristaPorPin(pin)
    if (motorista) {
      const sessao = { ...motorista, perfil: 'motorista' }
      setUsuario(sessao)
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessao))
      return { ok: true }
    }

    setErro('PIN incorreto')
    return { ok: false }
  }

  const logout = () => {
    setUsuario(null)
    localStorage.removeItem(SESSION_KEY)
  }

  return { usuario, carregando, erro, setErro, login, logout }
}
