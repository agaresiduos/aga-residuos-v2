import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [pin, setPin]       = useState('')
  const [shake, setShake]   = useState(false)
  const inputRef            = useRef(null)
  const { login, erro, setErro, usuario } = useAuth()
  const navigate            = useNavigate()

  // Se já logado, redireciona
  useEffect(() => {
    if (usuario) navigate(usuario.perfil === 'gestor' ? '/gestor' : '/motorista', { replace: true })
  }, [usuario])

  // Foca input invisível ao montar
  useEffect(() => { inputRef.current?.focus() }, [])

  const handlePin = (val) => {
    const limpo = val.replace(/\D/g, '').slice(0, 4)
    setPin(limpo)
    setErro(null)
    if (limpo.length === 4) tentarLogin(limpo)
  }

  const tentarLogin = async (p = pin) => {
    const { ok } = await login(p)
    if (!ok) {
      setShake(true)
      setPin('')
      setTimeout(() => setShake(false), 500)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="text-3xl font-title font-bold text-white tracking-tight">AGA</div>
        <div className="text-navy-300 text-sm font-semibold tracking-widest">RESÍDUOS</div>
      </div>

      <div className="w-full max-w-xs">
        {/* Card */}
        <div className="card p-8 text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h1 className="text-xl font-title font-bold text-white mb-1">Acesso</h1>
          <p className="text-navy-300 text-sm mb-8">Digite seu PIN de 4 dígitos</p>

          {/* Slots visuais */}
          <div
            className={`flex gap-3 justify-center mb-8 ${shake ? 'animate-[shake_0.4s_ease]' : ''}`}
            onClick={() => inputRef.current?.focus()}
            style={{ cursor: 'text' }}
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-14 h-16 rounded-xl flex items-center justify-center text-2xl transition-all duration-150 border-2 ${
                  erro
                    ? 'border-red-500 bg-red-900/20'
                    : pin.length > i
                    ? 'border-navy-400 bg-navy-700'
                    : 'border-navy-700 bg-navy-800'
                }`}
              >
                {pin.length > i
                  ? <span className="text-white">●</span>
                  : <span className="text-navy-700 text-sm">○</span>
                }
              </div>
            ))}
          </div>

          {/* Input invisível */}
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => handlePin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && tentarLogin()}
            className="absolute opacity-0 w-px h-px"
            autoComplete="off"
          />

          {erro && (
            <p className="text-red-400 text-xs font-semibold mb-4 -mt-4">{erro}</p>
          )}

          <button onClick={() => tentarLogin()} className="btn-primary">
            Entrar
          </button>
        </div>

        <p className="text-center text-navy-600 text-xs mt-6">
          AGA Resíduos · Soluções Ambientais
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}
