import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getColetasPorData, getColetasPorMes, atualizarColeta } from '../lib/supabase'
import { hoje, fmtData, fmtDataLonga, fmtHora, getDiasDoMes, getMesesNome, STATUS, agruparPorData } from '../lib/utils'

export default function AgendaGestor() {
  const { usuario, logout } = useAuth()
  const navigate            = useNavigate()
  const hj                  = hoje()

  const [dataSel, setDataSelRaw] = useState(hj)
  const [mesSel,  setMesSel]     = useState(() => {
    const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1)
  })
  const [coletas,     setColetas]     = useState([])
  const [coletasMes,  setColetasMes]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const [visao,       setVisao]       = useState('dia') // 'dia' | 'mes'
  const [filtro,      setFiltro]      = useState('todos')

  useEffect(() => { carregarDia() }, [dataSel])
  useEffect(() => { carregarMes() }, [mesSel])

  const carregarDia = async () => {
    setLoading(true)
    const rows = await getColetasPorData(dataSel)
    setColetas(rows)
    setLoading(false)
  }

  const carregarMes = async () => {
    const rows = await getColetasPorMes(mesSel.getFullYear(), mesSel.getMonth() + 1)
    setColetasMes(rows)
  }

  const setDataSel = (iso) => {
    setDataSelRaw(iso)
    const d = new Date(iso + 'T12:00:00')
    if (d.getMonth() !== mesSel.getMonth() || d.getFullYear() !== mesSel.getFullYear()) {
      setMesSel(new Date(d.getFullYear(), d.getMonth(), 1))
    }
    setVisao('dia')
  }

  const handleStatus = async (coletaId, status, ocorrencia = '') => {
    await atualizarColeta(coletaId, { status, ocorrencia })
    carregarDia()
    carregarMes()
  }

  const dias = getDiasDoMes(mesSel)
  const meses = getMesesNome()

  const statsDia = (iso) => {
    const d = coletasMes.filter(c => c.data === iso)
    return { total: d.length, realizadas: d.filter(c => c.status === 'realizada').length }
  }

  const coletasFiltradas = coletas.filter(c => filtro === 'todos' || c.status === filtro)
  const stats = {
    total:     coletas.length,
    realizada: coletas.filter(c => c.status === 'realizada').length,
    pendente:  coletas.filter(c => c.status === 'pendente').length,
  }
  const pct = stats.total ? Math.round((stats.realizada / stats.total) * 100) : 0

  return (
    <div className="min-h-screen bg-navy-900 max-w-md mx-auto">

      {/* Header */}
      <div className="bg-navy-800 border-b border-navy-700 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="text-white font-title font-bold text-lg">Agenda</div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/gestor/relatorio')}
              className="text-navy-400 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-navy-700 hover:border-navy-500 transition-colors">
              📊 Relatório
            </button>
            <button onClick={() => navigate('/gestor/painel')}
              className="text-navy-400 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-navy-700 hover:border-navy-500 transition-colors">
              ⚙ Painel
            </button>
            <button onClick={logout}
              className="text-navy-400 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-navy-700 hover:border-navy-500 transition-colors">
              Sair
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-24">

        {/* Calendário mini */}
        <div className="card p-3 mb-4">
          {/* Nav mês */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setMesSel(d => new Date(d.getFullYear(), d.getMonth()-1, 1))}
              className="w-8 h-8 rounded-lg bg-navy-700 hover:bg-navy-600 text-white flex items-center justify-center transition-colors text-sm">
              ◀
            </button>
            <span className="text-white font-title font-bold text-sm">
              {meses[mesSel.getMonth()]} {mesSel.getFullYear()}
            </span>
            <button onClick={() => setMesSel(d => new Date(d.getFullYear(), d.getMonth()+1, 1))}
              className="w-8 h-8 rounded-lg bg-navy-700 hover:bg-navy-600 text-white flex items-center justify-center transition-colors text-sm">
              ▶
            </button>
          </div>
          {/* Cabeçalho */}
          <div className="grid grid-cols-7 mb-1">
            {['D','S','T','Q','Q','S','S'].map((d,i) => (
              <div key={i} className="text-center text-navy-500 text-xs font-bold py-1">{d}</div>
            ))}
          </div>
          {/* Dias */}
          <div className="grid grid-cols-7 gap-0.5">
            {dias.map(({ iso, outroMes }) => {
              const st    = statsDia(iso)
              const isHj  = iso === hj
              const isSel = iso === dataSel
              return (
                <button key={iso} onClick={() => setDataSel(iso)}
                  className={`flex flex-col items-center py-1 rounded-lg transition-all duration-100 min-h-[36px] ${
                    isSel ? 'bg-navy-600' :
                    isHj  ? 'bg-navy-700 ring-1 ring-navy-400' :
                    'hover:bg-navy-700'
                  }`}>
                  <span className={`text-xs font-semibold leading-none ${
                    isSel ? 'text-white' :
                    isHj  ? 'text-white' :
                    outroMes ? 'text-navy-700' : 'text-navy-300'
                  }`}>
                    {parseInt(iso.slice(8))}
                  </span>
                  {st.total > 0 && !outroMes && (
                    <div className="flex gap-0.5 mt-0.5">
                      {st.realizadas > 0 && <span className="w-1 h-1 rounded-full bg-green-500" />}
                      {st.total - st.realizadas > 0 && <span className="w-1 h-1 rounded-full bg-amber-500" />}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Toggle dia / mês */}
        <div className="flex gap-2 mb-4">
          {['dia','mes'].map(v => (
            <button key={v} onClick={() => setVisao(v)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                visao === v ? 'bg-navy-600 text-white' : 'bg-navy-800 text-navy-400 border border-navy-700 hover:border-navy-500'
              }`}>
              {v === 'dia' ? '☀ Dia' : '☰ Mês'}
            </button>
          ))}
          {dataSel !== hj && (
            <button onClick={() => setDataSel(hj)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-navy-800 text-aga-teal border border-navy-700 hover:border-aga-teal/50 transition-colors">
              Hoje
            </button>
          )}
        </div>

        {/* VISÃO DIA */}
        {visao === 'dia' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-white font-title font-bold text-lg capitalize">
                  {dataSel === hj ? 'Hoje' : fmtData(dataSel)}
                </div>
                {stats.total > 0 && (
                  <div className="text-navy-400 text-xs mt-0.5">
                    {stats.realizada}/{stats.total} realizadas · {pct}%
                  </div>
                )}
              </div>
              <button onClick={() => navigate('/gestor/painel', { state: { aba: 'coletas', data: dataSel } })}
                className="text-xs font-bold px-3 py-2 bg-navy-700 hover:bg-navy-600 text-white rounded-xl transition-colors">
                + Coleta
              </button>
            </div>

            {/* Filtros */}
            {coletas.length > 0 && (
              <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
                {[['todos','Todos'], ...Object.entries(STATUS).map(([k,v]) => [k, v.label])].map(([val, lbl]) => (
                  <button key={val} onClick={() => setFiltro(val)}
                    className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                      filtro === val ? 'bg-navy-600 text-white' : 'bg-navy-800 text-navy-400 border border-navy-700'
                    }`}>
                    {lbl}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="text-center py-12 text-navy-500 text-sm">Carregando...</div>
            ) : coletasFiltradas.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📋</div>
                <div className="text-white font-title font-bold">Sem coletas</div>
                <div className="text-navy-500 text-sm mt-1">{fmtData(dataSel)}</div>
              </div>
            ) : (
              <div className="space-y-2">
                {coletasFiltradas.map(c => (
                  <CartaoColeta key={c.id} coleta={c} onStatus={handleStatus} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VISÃO MÊS LISTA */}
        {visao === 'mes' && (
          <div>
            {agruparPorData(coletasMes.filter(c => filtro === 'todos' || c.status === filtro))
              .map(({ data, coletas: grupo }) => (
              <div key={data} className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-px bg-navy-700" />
                  <button onClick={() => setDataSel(data)}
                    className={`text-xs font-bold px-3 py-1 rounded-full border transition-colors ${
                      data === hj
                        ? 'bg-aga-teal/10 text-aga-teal border-aga-teal/30'
                        : 'text-navy-400 border-navy-700 hover:border-navy-500'
                    }`}>
                    {data === hj ? 'HOJE · ' : ''}{fmtData(data)} · {grupo.length}
                  </button>
                  <div className="flex-1 h-px bg-navy-700" />
                </div>
                {grupo.map(c => <CartaoColeta key={c.id} coleta={c} onStatus={handleStatus} />)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Card de coleta (interno)
function CartaoColeta({ coleta: c, onStatus }) {
  const [aberto, setAberto] = useState(false)
  const st = STATUS[c.status]

  return (
    <div className="card overflow-hidden mb-2 fade-up" style={{ borderLeft: `3px solid ${st.cor}` }}>
      <div className="p-3 cursor-pointer" onClick={() => setAberto(a => !a)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-white font-title font-bold text-sm leading-tight truncate">{c.cliente_nome}</div>
            <div className="flex gap-3 mt-1 flex-wrap">
              {c.horario && <span className="text-navy-400 text-xs">⏰ {c.horario?.slice(0,5)}</span>}
              <span className="text-xs font-semibold" style={{ color: c.motorista_cor || '#94A3B8' }}>
                ● {c.motorista_nome}
              </span>
            </div>
            {c.cliente_endereco && (
              <div className="text-navy-500 text-xs mt-0.5 truncate">📍 {c.cliente_endereco}</div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className={`badge ${st.classe}`}>{st.label}</span>
            <span className="text-navy-600 text-xs">{aberto ? '▲' : '▼'}</span>
          </div>
        </div>
      </div>

      {aberto && (
        <div className="border-t border-navy-700 px-3 py-2 bg-navy-900/50">
          {c.ocorrencia && (
            <div className="text-navy-400 text-xs mb-2 p-2 bg-navy-800 rounded-lg border-l-2" style={{ borderColor: st.cor }}>
              {c.ocorrencia}
            </div>
          )}
          {c.registro_id && (
            <div className="text-aga-teal text-xs mb-2 flex items-center gap-1 font-semibold">
              ✓ Coleta registrada pelo motorista
            </div>
          )}
          <div className="flex gap-1.5 flex-wrap">
            {Object.entries(STATUS)
              .filter(([k]) => k !== c.status)
              .map(([k, v]) => (
                <button key={k} onClick={() => onStatus(c.id, k)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border"
                  style={{ background: `${v.cor}15`, color: v.cor, borderColor: `${v.cor}40` }}>
                  {v.label}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
