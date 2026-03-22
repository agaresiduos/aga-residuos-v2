import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  getClientes, criarCliente, removerCliente,
  getMotoristas, criarMotorista, removerMotorista, atualizarMotorista,
  getRecorrencias, criarRecorrencia, removerRecorrencia,
  criarColeta, removerColeta, getColetasPorMes,
} from '../lib/supabase'
import {
  hoje, fmtData, CORES_MOT, FREQUENCIAS,
  getDiasNome, gerarDatas, CATEGORIAS,
} from '../lib/utils'

const ABAS = [
  { id: 'coletas',      label: 'Coletas' },
  { id: 'recorrencias', label: 'Recorrentes' },
  { id: 'motoristas',   label: 'Motoristas' },
  { id: 'clientes',     label: 'Clientes' },
]

export default function PainelGestor() {
  const navigate      = useNavigate()
  const location      = useLocation()
  const { logout }    = useAuth()

  const [aba,          setAba]          = useState(location.state?.aba || 'coletas')
  const [clientes,     setClientes]     = useState([])
  const [motoristas,   setMotoristas]   = useState([])
  const [recorrencias, setRecorrencias] = useState([])
  const [coletas,      setColetas]      = useState([])
  const [modal,        setModal]        = useState(null) // { tipo, dados? }
  const [toast,        setToast]        = useState(null)
  const [loading,      setLoading]      = useState(true)

  const mesAtual = new Date()

  useEffect(() => { carregarTudo() }, [])

  const carregarTudo = async () => {
    setLoading(true)
    const [c, m, r, col] = await Promise.all([
      getClientes(),
      getMotoristas(),
      getRecorrencias(),
      getColetasPorMes(mesAtual.getFullYear(), mesAtual.getMonth() + 1),
    ])
    setClientes(c)
    setMotoristas(m)
    setRecorrencias(r)
    setColetas(col)
    setLoading(false)
  }

  const showToast = (msg, tipo = 'ok') => {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 2500)
  }

  // ── Handlers ─────────────────────────────────────────────────
  const handleCriarColeta = async (f) => {
    const { error } = await criarColeta({
      cliente_id: f.clienteId, motorista_id: f.motoristaId,
      data: f.data, horario: f.horario || null,
      status: 'pendente', observacao: f.observacao || '',
    })
    if (error) { showToast('Erro ao criar coleta', 'erro'); return }
    showToast('Coleta criada!')
    carregarTudo()
    setModal(null)
  }

  const handleRemoverColeta = async (id) => {
    await removerColeta(id)
    showToast('Coleta removida')
    carregarTudo()
  }

  const handleCriarMotorista = async (f) => {
    if (f.pin?.length !== 4) { showToast('PIN deve ter 4 dígitos', 'erro'); return }
    const cor = CORES_MOT[motoristas.length % CORES_MOT.length]
    const { error } = await criarMotorista(f.nome, f.pin, f.cor || cor)
    if (error) {
      showToast(error.message?.includes('unique') ? 'PIN já em uso' : 'Erro ao criar', 'erro')
      return
    }
    showToast('Motorista adicionado!')
    carregarTudo()
    setModal(null)
  }

  const handleRemoverMotorista = async (id) => {
    await removerMotorista(id)
    showToast('Motorista removido')
    carregarTudo()
  }

  const handleCriarCliente = async (f) => {
    const { error } = await criarCliente({
      nome: f.nome, endereco: f.endereco || '',
      tipo_residuo_padrao: f.tipoResiduo || '',
    })
    if (error) { showToast('Erro ao criar cliente', 'erro'); return }
    showToast('Cliente adicionado!')
    carregarTudo()
    setModal(null)
  }

  const handleRemoverCliente = async (id) => {
    await removerCliente(id)
    showToast('Cliente removido')
    carregarTudo()
  }

  const handleCriarRecorrencia = async (f, diasSemana) => {
    const { error } = await criarRecorrencia({
      cliente_id: f.clienteId, motorista_id: f.motoristaId,
      frequencia: f.frequencia, dias_semana: diasSemana,
      horario: f.horario || null,
    })
    if (error) { showToast('Erro ao criar recorrência', 'erro'); return }
    showToast('Recorrência criada!')
    carregarTudo()
    setModal(null)
  }

  const handleGerarColetas = async (rec, semanas) => {
    const datas = gerarDatas(hoje(), rec.frequencia, rec.dias_semana || [], semanas)
    const existentes = coletas.map(c => `${c.cliente_id}_${c.data}`)
    const novas = datas.filter(d => !existentes.includes(`${rec.cliente_id}_${d}`))
    await Promise.all(novas.map(d => criarColeta({
      cliente_id: rec.cliente_id, motorista_id: rec.motorista_id,
      data: d, horario: rec.horario, status: 'pendente',
      observacao: FREQUENCIAS[rec.frequencia], recorrencia_id: rec.id,
    })))
    showToast(`${novas.length} coleta(s) gerada(s)!`)
    carregarTudo()
    setModal(null)
  }

  // Agrupar coletas por data
  const coletasPorData = coletas.reduce((acc, c) => {
    if (!acc[c.data]) acc[c.data] = []
    acc[c.data].push(c)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-navy-900 max-w-md mx-auto">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl text-sm font-bold shadow-xl ${
          toast.tipo === 'erro' ? 'bg-red-600 text-white' : 'bg-navy-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <Modal
          modal={modal} setModal={setModal}
          clientes={clientes} motoristas={motoristas}
          onCriarColeta={handleCriarColeta}
          onCriarMotorista={handleCriarMotorista}
          onCriarCliente={handleCriarCliente}
          onCriarRecorrencia={handleCriarRecorrencia}
          onGerarColetas={handleGerarColetas}
        />
      )}

      {/* Header */}
      <div className="bg-navy-800 border-b border-navy-700 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/gestor')}
              className="text-navy-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-navy-700 transition-colors text-lg">
              ←
            </button>
            <div className="text-white font-title font-bold text-lg">Painel</div>
          </div>
          <button onClick={logout}
            className="text-navy-400 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-navy-700 hover:border-navy-500 transition-colors">
            Sair
          </button>
        </div>
      </div>

      {/* Abas */}
      <div className="flex border-b border-navy-700 bg-navy-800 sticky top-[57px] z-30">
        {ABAS.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            className={`flex-1 py-2.5 text-xs font-bold transition-colors ${
              aba === a.id
                ? 'text-white border-b-2 border-navy-400'
                : 'text-navy-500 hover:text-navy-300'
            }`}>
            {a.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 pb-24">

        {loading ? (
          <div className="text-center py-16 text-navy-500 text-sm">Carregando...</div>
        ) : (
          <>

            {/* ── COLETAS ── */}
            {aba === 'coletas' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-white font-title font-bold text-lg">Coletas do Mês</div>
                  <button onClick={() => setModal({ tipo: 'novaColeta' })}
                    className="px-3 py-1.5 bg-navy-600 hover:bg-navy-500 text-white text-xs font-bold rounded-xl transition-colors">
                    + Nova
                  </button>
                </div>
                {coletas.length === 0 ? (
                  <Vazio texto="Nenhuma coleta no mês" />
                ) : Object.entries(coletasPorData).sort(([a],[b]) => a.localeCompare(b)).map(([data, lista]) => (
                  <div key={data} className="mb-4">
                    <div className="text-navy-500 text-xs font-bold tracking-widest mb-2 uppercase">
                      {data === hoje() ? 'HOJE · ' : ''}{fmtData(data)} — {lista.length}
                    </div>
                    {lista.map(c => (
                      <div key={c.id} className="card p-3 mb-2 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-bold truncate">{c.cliente_nome}</div>
                          <div className="flex gap-2 mt-0.5">
                            {c.horario && <span className="text-navy-500 text-xs">{c.horario?.slice(0,5)}</span>}
                            <span className="text-xs font-semibold" style={{ color: c.motorista_cor || '#94A3B8' }}>
                              ● {c.motorista_nome}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`badge badge-${c.status}`}>{c.status}</span>
                          <button onClick={() => handleRemoverColeta(c.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-900/30 hover:bg-red-900/60 text-red-400 transition-colors text-xs">
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* ── RECORRÊNCIAS ── */}
            {aba === 'recorrencias' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-white font-title font-bold text-lg">Recorrências</div>
                    <div className="text-navy-500 text-xs mt-0.5">Gere coletas automaticamente</div>
                  </div>
                  <button onClick={() => setModal({ tipo: 'novaRecorrencia' })}
                    className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-colors">
                    + Nova
                  </button>
                </div>
                {recorrencias.length === 0 ? (
                  <Vazio texto="Nenhuma recorrência cadastrada" icone="🔄" />
                ) : recorrencias.map(r => (
                  <div key={r.id} className="card p-4 mb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-bold text-sm">{r.clientes?.nome}</div>
                        <div className="text-navy-400 text-xs mt-1">
                          {FREQUENCIAS[r.frequencia]}
                          {r.dias_semana?.length > 0 && ' · ' + r.dias_semana.map(d => getDiasNome()[d]).join(', ')}
                          {r.horario && ' · ' + r.horario?.slice(0,5)}
                        </div>
                        <div className="text-xs mt-1" style={{ color: r.motoristas?.cor || '#94A3B8' }}>
                          ● {r.motoristas?.nome}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <button onClick={() => setModal({ tipo: 'gerarColetas', rec: r })}
                          className="px-2.5 py-1.5 rounded-lg bg-aga-green/10 border border-aga-green/30 text-aga-green text-xs font-bold transition-colors hover:bg-aga-green/20">
                          ▶ Gerar
                        </button>
                        <button onClick={() => { removerRecorrencia(r.id); carregarTudo() }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-900/30 hover:bg-red-900/60 text-red-400 transition-colors text-xs">
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── MOTORISTAS ── */}
            {aba === 'motoristas' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-white font-title font-bold text-lg">Motoristas</div>
                  <button onClick={() => setModal({ tipo: 'novoMotorista' })}
                    className="px-3 py-1.5 bg-navy-600 hover:bg-navy-500 text-white text-xs font-bold rounded-xl transition-colors">
                    + Adicionar
                  </button>
                </div>
                {motoristas.length === 0 ? (
                  <Vazio texto="Nenhum motorista cadastrado" />
                ) : motoristas.map(m => (
                  <div key={m.id} className="card p-4 mb-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-title font-bold text-lg flex-shrink-0"
                      style={{ background: m.cor }}>
                      {m.nome[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-bold text-sm">{m.nome}</div>
                      <div className="text-navy-500 text-xs mt-0.5">
                        PIN: <span className="font-mono tracking-widest text-navy-300">{m.pin}</span>
                      </div>
                    </div>
                    <button onClick={() => handleRemoverMotorista(m.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-900/30 hover:bg-red-900/60 text-red-400 transition-colors text-xs">
                      ✕
                    </button>
                  </div>
                ))}
                <div className="mt-4 p-3 bg-navy-800 rounded-xl border border-navy-700 text-xs text-navy-400 text-center">
                  💡 Cada motorista acessa com seu PIN na tela de login
                </div>
              </div>
            )}

            {/* ── CLIENTES ── */}
            {aba === 'clientes' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-white font-title font-bold text-lg">Pontos de Coleta</div>
                  <button onClick={() => setModal({ tipo: 'novoCliente' })}
                    className="px-3 py-1.5 bg-navy-600 hover:bg-navy-500 text-white text-xs font-bold rounded-xl transition-colors">
                    + Adicionar
                  </button>
                </div>
                {clientes.length === 0 ? (
                  <Vazio texto="Nenhum cliente cadastrado" />
                ) : clientes.map(c => (
                  <div key={c.id} className="card p-4 mb-2 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-bold text-sm">{c.nome}</div>
                      {c.endereco && <div className="text-navy-500 text-xs mt-0.5 truncate">📍 {c.endereco}</div>}
                      {c.tipo_residuo_padrao && <div className="text-navy-500 text-xs">♻ {c.tipo_residuo_padrao}</div>}
                    </div>
                    <button onClick={() => handleRemoverCliente(c.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-900/30 hover:bg-red-900/60 text-red-400 transition-colors text-xs flex-shrink-0">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Componente Modal ──────────────────────────────────────────
function Modal({ modal, setModal, clientes, motoristas, onCriarColeta, onCriarMotorista, onCriarCliente, onCriarRecorrencia, onGerarColetas }) {
  const [f,    setF]    = useState({})
  const [dias, setDias] = useState([])

  useEffect(() => {
    if (modal.tipo === 'novaColeta')      setF({ data: hoje(), horario: '', observacao: '' })
    else if (modal.tipo === 'gerarColetas') setF({ semanas: 8 })
    else setF({})
    setDias([])
  }, [modal.tipo])

  const up = (k, v) => setF(p => ({ ...p, [k]: v }))

  const titulos = {
    novaColeta: 'Nova Coleta', novoMotorista: 'Novo Motorista',
    novoCliente: 'Novo Ponto de Coleta', novaRecorrencia: 'Nova Recorrência',
    gerarColetas: 'Gerar Coletas',
  }

  const TIPOS_RESIDUO = Object.entries(CATEGORIAS).map(([k, v]) => v.label)

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && setModal(null)}>
      <div className="slide-up bg-navy-800 rounded-t-2xl w-full max-w-md max-h-[92vh] overflow-y-auto pb-10 border-t border-navy-700">
        <div className="w-9 h-1 bg-navy-600 rounded mx-auto mt-3 mb-4" />
        <div className="px-5">
          <div className="flex items-center justify-between mb-5">
            <div className="text-white font-title font-bold text-lg">{titulos[modal.tipo]}</div>
            <button onClick={() => setModal(null)}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-navy-700 text-navy-400 hover:text-white transition-colors text-xl">
              ×
            </button>
          </div>

          {/* Nova Coleta */}
          {modal.tipo === 'novaColeta' && (
            <div className="space-y-3">
              <div><label className="label">Cliente *</label>
                <select value={f.clienteId||''} onChange={e=>up('clienteId',e.target.value)} className="input">
                  <option value="">Selecione...</option>
                  {clientes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
                </select></div>
              <div><label className="label">Motorista *</label>
                <select value={f.motoristaId||''} onChange={e=>up('motoristaId',e.target.value)} className="input">
                  <option value="">Selecione...</option>
                  {motoristas.map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Data *</label>
                  <input type="date" value={f.data||''} onChange={e=>up('data',e.target.value)} className="input"/></div>
                <div><label className="label">Horário</label>
                  <input type="time" value={f.horario||''} onChange={e=>up('horario',e.target.value)} className="input"/></div>
              </div>
              <div><label className="label">Observação</label>
                <textarea value={f.observacao||''} onChange={e=>up('observacao',e.target.value)}
                  rows={2} className="input resize-none"/></div>
              <button onClick={() => onCriarColeta(f)} className="btn-primary mt-2">Criar Coleta</button>
            </div>
          )}

          {/* Novo Motorista */}
          {modal.tipo === 'novoMotorista' && (
            <div className="space-y-3">
              <div><label className="label">Nome *</label>
                <input value={f.nome||''} onChange={e=>up('nome',e.target.value)}
                  placeholder="Ex: João Silva" className="input"/></div>
              <div><label className="label">PIN (4 dígitos) *</label>
                <input type="password" inputMode="numeric" maxLength={4}
                  value={f.pin||''} onChange={e=>up('pin',e.target.value.replace(/\D/g,'').slice(0,4))}
                  placeholder="••••" className="input text-center tracking-widest text-lg"/>
                <div className="text-navy-500 text-xs mt-1">O motorista usará este PIN para acessar o app</div>
              </div>
              <div><label className="label">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {CORES_MOT.map(cor => (
                    <button key={cor} onClick={() => up('cor', cor)}
                      className={`w-8 h-8 rounded-full transition-all ${f.cor === cor ? 'ring-2 ring-white ring-offset-2 ring-offset-navy-800 scale-110' : ''}`}
                      style={{ background: cor }}/>
                  ))}
                </div>
              </div>
              <button onClick={() => onCriarMotorista(f)} className="btn-primary mt-2">Adicionar Motorista</button>
            </div>
          )}

          {/* Novo Cliente */}
          {modal.tipo === 'novoCliente' && (
            <div className="space-y-3">
              <div><label className="label">Nome *</label>
                <input value={f.nome||''} onChange={e=>up('nome',e.target.value)}
                  placeholder="Ex: Mercado Central" className="input"/></div>
              <div><label className="label">Endereço</label>
                <input value={f.endereco||''} onChange={e=>up('endereco',e.target.value)}
                  placeholder="Rua, número..." className="input"/></div>
              <div><label className="label">Tipo de Resíduo Principal</label>
                <select value={f.tipoResiduo||''} onChange={e=>up('tipoResiduo',e.target.value)} className="input">
                  <option value="">Selecione...</option>
                  {TIPOS_RESIDUO.map(t=><option key={t}>{t}</option>)}
                </select></div>
              <button onClick={() => onCriarCliente(f)} className="btn-primary mt-2">Adicionar Cliente</button>
            </div>
          )}

          {/* Nova Recorrência */}
          {modal.tipo === 'novaRecorrencia' && (
            <div className="space-y-3">
              <div><label className="label">Cliente *</label>
                <select value={f.clienteId||''} onChange={e=>up('clienteId',e.target.value)} className="input">
                  <option value="">Selecione...</option>
                  {clientes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
                </select></div>
              <div><label className="label">Motorista *</label>
                <select value={f.motoristaId||''} onChange={e=>up('motoristaId',e.target.value)} className="input">
                  <option value="">Selecione...</option>
                  {motoristas.map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}
                </select></div>
              <div><label className="label">Frequência</label>
                <select value={f.frequencia||'semanal'} onChange={e=>up('frequencia',e.target.value)} className="input">
                  {Object.entries(FREQUENCIAS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select></div>
              {(f.frequencia==='semanal'||f.frequencia==='quinzenal') && (
                <div><label className="label">Dias da Semana</label>
                  <div className="flex gap-2 flex-wrap">
                    {getDiasNome().map((d,i)=>(
                      <button key={i} onClick={()=>setDias(p=>p.includes(i)?p.filter(x=>x!==i):[...p,i])}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          dias.includes(i) ? 'bg-navy-600 text-white' : 'bg-navy-700 text-navy-400 hover:bg-navy-600'
                        }`}>{d}</button>
                    ))}
                  </div></div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Horário</label>
                  <input type="time" value={f.horario||''} onChange={e=>up('horario',e.target.value)} className="input"/></div>
              </div>
              <button onClick={() => onCriarRecorrencia(f, dias)} className="btn-primary mt-2">Criar Recorrência</button>
            </div>
          )}

          {/* Gerar Coletas */}
          {modal.tipo === 'gerarColetas' && (
            <div className="space-y-4">
              <div className="bg-navy-900 rounded-xl p-3 border border-navy-700">
                <div className="text-white font-bold text-sm">{modal.rec?.clientes?.nome}</div>
                <div className="text-navy-400 text-xs mt-1">
                  {FREQUENCIAS[modal.rec?.frequencia]}
                  {modal.rec?.dias_semana?.length > 0 && ' · ' + modal.rec.dias_semana.map(d=>getDiasNome()[d]).join(', ')}
                </div>
              </div>
              <div><label className="label">Gerar para quantas semanas?</label>
                <input type="number" min={1} max={52} value={f.semanas||8}
                  onChange={e=>up('semanas',parseInt(e.target.value))} className="input"/>
                <div className="text-navy-500 text-xs mt-1">Coletas já existentes não serão duplicadas</div>
              </div>
              <button onClick={() => onGerarColetas(modal.rec, f.semanas || 8)} className="btn-success">
                ▶ Gerar Coletas
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Vazio({ texto, icone = '📋' }) {
  return (
    <div className="text-center py-14">
      <div className="text-5xl mb-3">{icone}</div>
      <div className="text-navy-500 text-sm">{texto}</div>
    </div>
  )
}
