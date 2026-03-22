import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { sb, getTiposResiduo, getRegistro, salvarRegistro, uploadFoto, atualizarColeta } from '../lib/supabase'
import { fmtData, CATEGORIAS } from '../lib/utils'

export default function RegistroColeta() {
  const { id }        = useParams()
  const navigate      = useNavigate()
  const { usuario }   = useAuth()
  const fotoRef       = useRef(null)

  const [coleta,      setColeta]      = useState(null)
  const [tipos,       setTipos]       = useState([])
  const [itens,       setItens]       = useState({})   // { [tipo_id]: quantidade }
  const [observacao,  setObservacao]  = useState('')
  const [foto,        setFoto]        = useState(null) // File
  const [fotoPreview, setFotoPreview] = useState(null)
  const [salvando,    setSalvando]    = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [erro,        setErro]        = useState(null)

  useEffect(() => { carregar() }, [id])

  const carregar = async () => {
    setLoading(true)
    // Buscar dados da coleta
    const { data: c } = await sb.from('v_coletas').select('*').eq('id', id).single()
    setColeta(c)

    // Buscar tipos de resíduo
    const t = await getTiposResiduo()
    setTipos(t)

    // Buscar registro existente (se já registrou antes)
    const reg = await getRegistro(id)
    if (reg) {
      setObservacao(reg.observacao || '')
      if (reg.foto_url) setFotoPreview(reg.foto_url)
      const itensExist = {}
      reg.itens_coleta?.forEach(i => {
        itensExist[i.tipo_residuo_id] = i.quantidade
      })
      setItens(itensExist)
    }

    setLoading(false)
  }

  const handleFoto = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFoto(f)
    setFotoPreview(URL.createObjectURL(f))
  }

  const setQuantidade = (tipoId, val) => {
    const num = val === '' ? '' : parseFloat(val)
    setItens(p => ({ ...p, [tipoId]: num }))
  }

  const totalItens = Object.values(itens).filter(v => v > 0).length

  const salvar = async () => {
    setSalvando(true)
    setErro(null)

    try {
      // Upload de foto se houver
      let fotoUrl = fotoPreview
      if (foto) {
        fotoUrl = await uploadFoto(id, foto)
        if (!fotoUrl) { setErro('Erro ao enviar foto'); setSalvando(false); return }
      }

      // Montar itens
      const itensArray = Object.entries(itens)
        .filter(([, q]) => q > 0)
        .map(([tipoId, quantidade]) => {
          const tipo = tipos.find(t => t.id === parseInt(tipoId))
          return { tipo_residuo_id: parseInt(tipoId), quantidade, unidade: tipo?.unidade || 'kg' }
        })

      const { error } = await salvarRegistro({
        coletaId:    id,
        motoristaId: usuario.id,
        observacao,
        fotoUrl,
        itens: itensArray,
      })

      if (error) { setErro('Erro ao salvar. Tente novamente.'); setSalvando(false); return }

      navigate('/motorista')
    } catch (e) {
      setErro('Erro inesperado. Tente novamente.')
      setSalvando(false)
    }
  }

  const reagendar = async () => {
    await atualizarColeta(id, { status: 'reagendada' })
    navigate('/motorista')
  }

  // Agrupar tipos por categoria
  const tiposPorCategoria = tipos.reduce((acc, t) => {
    if (!acc[t.categoria]) acc[t.categoria] = []
    acc[t.categoria].push(t)
    return acc
  }, {})

  if (loading) return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center text-navy-400 text-sm">
      Carregando...
    </div>
  )

  return (
    <div className="min-h-screen bg-navy-900 max-w-md mx-auto">

      {/* Header */}
      <div className="bg-navy-800 border-b border-navy-700 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => navigate('/motorista')}
          className="text-navy-400 hover:text-white transition-colors text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-navy-700">
          ←
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-navy-400 font-semibold tracking-wide">REGISTRO DE COLETA</div>
          <div className="text-white font-title font-bold truncate">{coleta?.cliente_nome}</div>
        </div>
      </div>

      <div className="px-4 py-4 pb-32">

        {/* Info do ponto */}
        <div className="card p-4 mb-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-white font-title font-bold text-lg">{coleta?.cliente_nome}</div>
              {coleta?.cliente_endereco && (
                <div className="text-navy-400 text-sm mt-1 flex items-center gap-1">
                  📍 {coleta.cliente_endereco}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-4 mt-3 pt-3 border-t border-navy-700">
            <div>
              <div className="text-navy-500 text-xs">Data</div>
              <div className="text-white text-sm font-semibold">{fmtData(coleta?.data)}</div>
            </div>
            {coleta?.horario && (
              <div>
                <div className="text-navy-500 text-xs">Horário</div>
                <div className="text-white text-sm font-semibold">{coleta.horario?.slice(0,5)}</div>
              </div>
            )}
            <div>
              <div className="text-navy-500 text-xs">Motorista</div>
              <div className="text-white text-sm font-semibold">{coleta?.motorista_nome}</div>
            </div>
          </div>
        </div>

        {/* Tipos de resíduo por categoria */}
        <div className="mb-5">
          <h2 className="text-xs font-semibold text-navy-400 tracking-widest mb-3">VOLUME COLETADO</h2>
          {Object.entries(tiposPorCategoria).map(([cat, lista]) => {
            const catInfo = CATEGORIAS[cat] || { label: cat, cor: '#94A3B8' }
            return (
              <div key={cat} className="card mb-3 overflow-hidden">
                {/* Header categoria */}
                <div className="px-4 py-2 border-b border-navy-700 flex items-center gap-2"
                  style={{ borderLeftColor: catInfo.cor, borderLeftWidth: 3 }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: catInfo.cor }} />
                  <span className="text-xs font-bold tracking-wide" style={{ color: catInfo.cor }}>
                    {catInfo.label.toUpperCase()}
                  </span>
                </div>

                <div className="divide-y divide-navy-700">
                  {lista.map(tipo => (
                    <div key={tipo.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="text-white text-sm font-semibold">{tipo.nome}</div>
                        <div className="text-navy-500 text-xs">{tipo.unidade}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQuantidade(tipo.id, Math.max(0, (parseFloat(itens[tipo.id]) || 0) - (tipo.unidade === 'un' ? 1 : 0.5)))}
                          className="w-8 h-8 rounded-lg bg-navy-700 hover:bg-navy-600 text-white flex items-center justify-center text-lg transition-colors"
                        >−</button>
                        <input
                          type="number"
                          min="0"
                          step={tipo.unidade === 'un' ? '1' : '0.1'}
                          value={itens[tipo.id] || ''}
                          onChange={e => setQuantidade(tipo.id, e.target.value)}
                          placeholder="0"
                          className="w-16 text-center input py-1.5 text-sm"
                        />
                        <button
                          onClick={() => setQuantidade(tipo.id, (parseFloat(itens[tipo.id]) || 0) + (tipo.unidade === 'un' ? 1 : 0.5))}
                          className="w-8 h-8 rounded-lg bg-navy-700 hover:bg-navy-600 text-white flex items-center justify-center text-lg transition-colors"
                        >+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Foto */}
        <div className="mb-5">
          <h2 className="text-xs font-semibold text-navy-400 tracking-widest mb-3">FOTO (OPCIONAL)</h2>
          <div
            className="card p-4 flex flex-col items-center justify-center cursor-pointer hover:border-navy-500 transition-colors min-h-[140px]"
            onClick={() => fotoRef.current?.click()}
          >
            {fotoPreview ? (
              <img src={fotoPreview} alt="Foto da coleta" className="w-full max-h-48 object-cover rounded-xl" />
            ) : (
              <>
                <div className="text-4xl mb-2">📷</div>
                <div className="text-navy-400 text-sm">Toque para tirar foto</div>
                <div className="text-navy-600 text-xs mt-1">ou selecionar da galeria</div>
              </>
            )}
          </div>
          <input ref={fotoRef} type="file" accept="image/*" capture="environment"
            className="hidden" onChange={handleFoto} />
          {fotoPreview && (
            <button onClick={() => { setFoto(null); setFotoPreview(null) }}
              className="w-full mt-2 text-xs text-navy-500 hover:text-red-400 transition-colors py-1">
              Remover foto
            </button>
          )}
        </div>

        {/* Observação */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-navy-400 tracking-widest mb-3">OBSERVAÇÃO (OPCIONAL)</h2>
          <textarea
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
            placeholder="Ex: Portão fechado, aguardou 10 min..."
            rows={3}
            className="input resize-none"
          />
        </div>

        {erro && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-3 mb-4 text-red-400 text-sm text-center">
            {erro}
          </div>
        )}

        {/* Resumo do que foi preenchido */}
        {totalItens > 0 && (
          <div className="bg-navy-800 rounded-xl p-3 mb-4 flex items-center gap-2 border border-navy-700">
            <span className="text-aga-teal text-lg">✓</span>
            <span className="text-navy-300 text-sm font-semibold">
              {totalItens} tipo{totalItens !== 1 ? 's' : ''} de resíduo registrado{totalItens !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Botões fixos no rodapé */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 pb-6 pt-3 bg-gradient-to-t from-navy-900 via-navy-900 to-transparent">
        <button onClick={salvar} disabled={salvando}
          className={`btn-success mb-2 ${salvando ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {salvando ? 'Salvando...' : '✓ Confirmar Coleta'}
        </button>
        <button onClick={reagendar} disabled={salvando}
          className="btn-secondary text-sm">
          ↻ Reagendar
        </button>
      </div>
    </div>
  )
}
