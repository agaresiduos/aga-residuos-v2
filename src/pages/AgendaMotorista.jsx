import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getColetasPorMotoristaData } from '../lib/supabase'
import { hoje, fmtDataLonga, fmtHora, STATUS } from '../lib/utils'

export default function AgendaMotorista() {
  const { usuario, logout }   = useAuth()
  const navigate              = useNavigate()
  const [coletas, setColetas] = useState([])
  const [loading, setLoading] = useState(true)
  const data                  = hoje()

  useEffect(() => {
    carregar()
  }, [])

  const carregar = async () => {
    setLoading(true)
    const rows = await getColetasPorMotoristaData(usuario.id, data)
    setColetas(rows)
    setLoading(false)
  }

  const realizadas  = coletas.filter(c => c.status === 'realizada').length
  const pendentes   = coletas.filter(c => c.status === 'pendente').length
  const pct         = coletas.length ? Math.round((realizadas / coletas.length) * 100) : 0

  return (
    <div className="min-h-screen bg-navy-900 max-w-md mx-auto">

      {/* Header */}
      <div className="bg-navy-800 border-b border-navy-700 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div>
          <div className="text-xs text-navy-400 font-semibold tracking-wide">MOTORISTA</div>
          <div className="text-white font-title font-bold text-lg leading-tight">{usuario.nome}</div>
        </div>
        <button onClick={logout} className="text-navy-400 hover:text-white text-xs font-semibold transition-colors px-3 py-1.5 rounded-lg border border-navy-700 hover:border-navy-500">
          Sair
        </button>
      </div>

      <div className="px-4 py-4 pb-24">

        {/* Data de hoje */}
        <div className="mb-4">
          <div className="text-2xl font-title font-bold text-white capitalize">
            {fmtDataLonga(data)}
          </div>
          <div className="text-navy-400 text-sm mt-0.5">Sua rota de hoje</div>
        </div>

        {/* Resumo */}
        {coletas.length > 0 && (
          <div className="card p-4 mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-navy-300 text-sm font-semibold">{coletas.length} ponto{coletas.length !== 1 ? 's' : ''}</span>
              <span className="text-aga-teal font-title font-bold text-lg">{pct}%</span>
            </div>
            {/* Barra de progresso */}
            <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
              <div
                className="h-1.5 bg-aga-teal rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex gap-4 mt-3">
              {pendentes > 0 && (
                <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  {pendentes} pendente{pendentes !== 1 ? 's' : ''}
                </span>
              )}
              {realizadas > 0 && (
                <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                  {realizadas} realizada{realizadas !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Lista de coletas */}
        {loading ? (
          <div className="text-center py-16 text-navy-500 text-sm">Carregando rota...</div>
        ) : coletas.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🎉</div>
            <div className="text-white font-title font-bold text-lg">Sem coletas hoje</div>
            <div className="text-navy-400 text-sm mt-1">Aproveite o dia!</div>
          </div>
        ) : (
          <div className="space-y-3">
            {coletas.map((c, idx) => {
              const st          = STATUS[c.status]
              const feita       = c.status === 'realizada'
              const cancelada   = c.status === 'cancelada'

              return (
                <div
                  key={c.id}
                  className={`card p-4 flex gap-3 transition-all duration-150 ${
                    !feita && !cancelada ? 'cursor-pointer hover:border-navy-500 active:scale-[0.98]' : 'opacity-75'
                  }`}
                  onClick={() => !feita && !cancelada && navigate(`/motorista/coleta/${c.id}`)}
                >
                  {/* Número do ponto */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-title font-bold flex-shrink-0 ${
                    feita ? 'bg-green-900/50 text-green-400' : 'bg-navy-700 text-navy-300'
                  }`}>
                    {feita ? '✓' : idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-title font-bold text-white text-base leading-tight truncate">
                        {c.cliente_nome}
                      </div>
                      <span className={`badge ${st.classe} flex-shrink-0`}>{st.label}</span>
                    </div>

                    {c.cliente_endereco && (
                      <div className="text-navy-400 text-xs mt-1 flex items-center gap-1 truncate">
                        <span>📍</span>{c.cliente_endereco}
                      </div>
                    )}

                    <div className="flex gap-3 mt-2 flex-wrap">
                      {c.horario && (
                        <span className="text-navy-300 text-xs flex items-center gap-1">
                          ⏰ {fmtHora(c.horario)}
                        </span>
                      )}
                      {c.registro_obs && (
                        <span className="text-aga-teal text-xs flex items-center gap-1">
                          ✓ Registrado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
