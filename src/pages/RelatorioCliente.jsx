import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getClientes, getItensPorPeriodo } from '../lib/supabase'
import { fmtData, hoje, CATEGORIAS } from '../lib/utils'

export default function RelatorioCliente() {
  const navigate    = useNavigate()
  const { logout }  = useAuth()

  const anoAtual = new Date().getFullYear()
  const mesAtual = new Date().getMonth() + 1

  const [clientes,   setClientes]   = useState([])
  const [clienteId,  setClienteId]  = useState('')
  const [dataInicio, setDataInicio] = useState(`${anoAtual}-${String(mesAtual).padStart(2,'0')}-01`)
  const [dataFim,    setDataFim]    = useState(hoje())
  const [dados,      setDados]      = useState(null)
  const [loading,    setLoading]    = useState(false)

  useEffect(() => { getClientes().then(setClientes) }, [])

  const buscar = async () => {
    if (!clienteId) return
    setLoading(true)
    const d = await getItensPorPeriodo(clienteId, dataInicio, dataFim)
    setDados(d)
    setLoading(false)
  }

  // Calcular totais por tipo de resíduo
  const totaisPorTipo = dados?.reduce((acc, coleta) => {
    coleta.registros?.forEach(reg => {
      reg.itens_coleta?.forEach(item => {
        const nome = item.tipos_residuo?.nome || 'Outro'
        const cat  = item.tipos_residuo?.categoria || 'outro'
        if (!acc[nome]) acc[nome] = { quantidade: 0, unidade: item.unidade, categoria: cat }
        acc[nome].quantidade += parseFloat(item.quantidade) || 0
      })
    })
    return acc
  }, {}) || {}

  const totalColetas  = dados?.length || 0
  const realizadas    = dados?.filter(c => c.status === 'realizada').length || 0
  const comRegistro   = dados?.filter(c => c.registros?.length > 0).length || 0
  const clienteNome   = clientes.find(c => c.id === clienteId)?.nome || ''

  // Agrupar totais por categoria
  const totaisPorCategoria = Object.entries(totaisPorTipo).reduce((acc, [nome, info]) => {
    if (!acc[info.categoria]) acc[info.categoria] = []
    acc[info.categoria].push({ nome, ...info })
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-navy-900 max-w-md mx-auto">

      {/* Header */}
      <div className="bg-navy-800 border-b border-navy-700 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/gestor')}
              className="text-navy-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-navy-700 transition-colors text-lg">
              ←
            </button>
            <div className="text-white font-title font-bold text-lg">Relatório</div>
          </div>
          <button onClick={logout}
            className="text-navy-400 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-navy-700 hover:border-navy-500 transition-colors">
            Sair
          </button>
        </div>
      </div>

      <div className="px-4 py-4 pb-24">

        {/* Filtros */}
        <div className="card p-4 mb-5 space-y-3">
          <div>
            <label className="label">Cliente</label>
            <select value={clienteId} onChange={e => setClienteId(e.target.value)} className="input">
              <option value="">Selecione um cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">De</label>
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="input"/>
            </div>
            <div>
              <label className="label">Até</label>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="input"/>
            </div>
          </div>
          <button onClick={buscar} disabled={!clienteId || loading}
            className={`btn-primary ${!clienteId ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {loading ? 'Buscando...' : '🔍 Gerar Relatório'}
          </button>
        </div>

        {/* Resultado */}
        {dados !== null && (
          <div className="fade-up">

            {/* Cabeçalho do relatório */}
            <div className="mb-5">
              <div className="text-white font-title font-bold text-xl">{clienteNome}</div>
              <div className="text-navy-400 text-sm mt-1">
                {fmtData(dataInicio)} → {fmtData(dataFim)}
              </div>
            </div>

            {/* Cards de resumo */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="card p-3 text-center">
                <div className="text-navy-400 text-xs mb-1">Total</div>
                <div className="text-white font-title font-bold text-2xl">{totalColetas}</div>
                <div className="text-navy-500 text-xs">coletas</div>
              </div>
              <div className="card p-3 text-center">
                <div className="text-navy-400 text-xs mb-1">Realizadas</div>
                <div className="text-green-400 font-title font-bold text-2xl">{realizadas}</div>
                <div className="text-navy-500 text-xs">
                  {totalColetas ? Math.round(realizadas/totalColetas*100) : 0}%
                </div>
              </div>
              <div className="card p-3 text-center">
                <div className="text-navy-400 text-xs mb-1">Registros</div>
                <div className="text-aga-teal font-title font-bold text-2xl">{comRegistro}</div>
                <div className="text-navy-500 text-xs">com dados</div>
              </div>
            </div>

            {/* Totais por resíduo */}
            {Object.keys(totaisPorTipo).length > 0 ? (
              <div className="mb-5">
                <div className="text-xs font-bold text-navy-400 tracking-widest mb-3">VOLUME TOTAL COLETADO</div>
                {Object.entries(totaisPorCategoria).map(([cat, itens]) => {
                  const catInfo = CATEGORIAS[cat] || { label: cat, cor: '#94A3B8' }
                  return (
                    <div key={cat} className="card mb-3 overflow-hidden">
                      <div className="px-4 py-2 border-b border-navy-700 flex items-center gap-2"
                        style={{ borderLeftColor: catInfo.cor, borderLeftWidth: 3 }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: catInfo.cor }} />
                        <span className="text-xs font-bold tracking-wide" style={{ color: catInfo.cor }}>
                          {catInfo.label.toUpperCase()}
                        </span>
                      </div>
                      <div className="divide-y divide-navy-700">
                        {itens.map(item => (
                          <div key={item.nome} className="px-4 py-3 flex items-center justify-between">
                            <span className="text-white text-sm font-semibold">{item.nome}</span>
                            <span className="text-aga-teal font-title font-bold text-base">
                              {item.quantidade % 1 === 0 ? item.quantidade : item.quantidade.toFixed(1)}
                              <span className="text-navy-400 text-xs font-normal ml-1">{item.unidade}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="card p-6 text-center mb-5">
                <div className="text-3xl mb-2">📭</div>
                <div className="text-navy-400 text-sm">Nenhum volume registrado no período</div>
              </div>
            )}

            {/* Histórico detalhado */}
            <div>
              <div className="text-xs font-bold text-navy-400 tracking-widest mb-3">HISTÓRICO DETALHADO</div>
              {dados.length === 0 ? (
                <div className="text-center py-8 text-navy-500 text-sm">Nenhuma coleta no período</div>
              ) : dados.map(coleta => {
                const reg = coleta.registros?.[0]
                return (
                  <div key={coleta.id} className="card p-3 mb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-white text-sm font-bold">{fmtData(coleta.data)}</div>
                        {reg?.realizado_em && (
                          <div className="text-navy-500 text-xs mt-0.5">
                            Registrado em {new Date(reg.realizado_em).toLocaleString('pt-BR')}
                          </div>
                        )}
                      </div>
                      <span className={`badge badge-${coleta.status} flex-shrink-0`}>{coleta.status}</span>
                    </div>

                    {reg?.itens_coleta?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-navy-700">
                        <div className="flex flex-wrap gap-2">
                          {reg.itens_coleta.map((item, i) => (
                            <span key={i} className="text-xs bg-navy-700 text-navy-300 px-2 py-0.5 rounded-full">
                              {item.tipos_residuo?.nome}: <strong className="text-white">{item.quantidade} {item.unidade}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {reg?.observacao && (
                      <div className="mt-2 text-navy-400 text-xs border-t border-navy-700 pt-2">
                        📝 {reg.observacao}
                      </div>
                    )}

                    {reg?.foto_url && (
                      <div className="mt-2">
                        <img src={reg.foto_url} alt="Foto da coleta"
                          className="w-full max-h-32 object-cover rounded-lg border border-navy-700" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
