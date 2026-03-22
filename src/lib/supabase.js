import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const sb = createClient(url, key)

// ── Motoristas ────────────────────────────────────────────────
export const getMotoristaPorPin = async (pin) => {
  const { data, error } = await sb
    .from('motoristas')
    .select('*')
    .eq('pin', pin)
    .eq('ativo', true)
    .single()
  if (error) return null
  return data
}

export const getMotoristas = async () => {
  const { data } = await sb
    .from('motoristas')
    .select('*')
    .eq('ativo', true)
    .order('nome')
  return data || []
}

export const criarMotorista = async (nome, pin, cor) => {
  const { data, error } = await sb
    .from('motoristas')
    .insert({ nome, pin, cor })
    .select()
    .single()
  return { data, error }
}

export const atualizarMotorista = async (id, campos) => {
  const { error } = await sb.from('motoristas').update(campos).eq('id', id)
  return { error }
}

export const removerMotorista = async (id) => {
  const { error } = await sb.from('motoristas').update({ ativo: false }).eq('id', id)
  return { error }
}

// ── Clientes ─────────────────────────────────────────────────
export const getClientes = async () => {
  const { data } = await sb
    .from('clientes')
    .select('*')
    .eq('ativo', true)
    .order('nome')
  return data || []
}

export const criarCliente = async (campos) => {
  const { data, error } = await sb.from('clientes').insert(campos).select().single()
  return { data, error }
}

export const atualizarCliente = async (id, campos) => {
  const { error } = await sb.from('clientes').update(campos).eq('id', id)
  return { error }
}

export const removerCliente = async (id) => {
  const { error } = await sb.from('clientes').update({ ativo: false }).eq('id', id)
  return { error }
}

// ── Coletas ───────────────────────────────────────────────────
export const getColetasPorData = async (data) => {
  const { data: rows } = await sb
    .from('v_coletas')
    .select('*')
    .eq('data', data)
    .order('horario', { nullsFirst: false })
  return rows || []
}

export const getColetasPorMotoristaData = async (motoristaId, data) => {
  const { data: rows } = await sb
    .from('v_coletas')
    .select('*')
    .eq('motorista_id', motoristaId)
    .eq('data', data)
    .order('horario', { nullsFirst: false })
  return rows || []
}

export const getColetasPorMes = async (ano, mes) => {
  const inicio = `${ano}-${String(mes).padStart(2,'0')}-01`
  const fim    = `${ano}-${String(mes).padStart(2,'0')}-31`
  const { data: rows } = await sb
    .from('v_coletas')
    .select('*')
    .gte('data', inicio)
    .lte('data', fim)
    .order('data')
    .order('horario', { nullsFirst: false })
  return rows || []
}

export const criarColeta = async (campos) => {
  const { data, error } = await sb.from('coletas').insert(campos).select().single()
  return { data, error }
}

export const atualizarColeta = async (id, campos) => {
  const { error } = await sb.from('coletas').update(campos).eq('id', id)
  return { error }
}

export const removerColeta = async (id) => {
  const { error } = await sb.from('coletas').delete().eq('id', id)
  return { error }
}

// ── Recorrências ──────────────────────────────────────────────
export const getRecorrencias = async () => {
  const { data } = await sb
    .from('recorrencias')
    .select('*, clientes(nome), motoristas(nome, cor)')
    .eq('ativo', true)
    .order('criado_em')
  return data || []
}

export const criarRecorrencia = async (campos) => {
  const { data, error } = await sb.from('recorrencias').insert(campos).select().single()
  return { data, error }
}

export const removerRecorrencia = async (id) => {
  const { error } = await sb.from('recorrencias').update({ ativo: false }).eq('id', id)
  return { error }
}

// ── Tipos de Resíduo ──────────────────────────────────────────
export const getTiposResiduo = async () => {
  const { data } = await sb
    .from('tipos_residuo')
    .select('*')
    .eq('ativo', true)
    .order('categoria')
    .order('nome')
  return data || []
}

// ── Registros de Coleta ───────────────────────────────────────
export const getRegistro = async (coletaId) => {
  const { data } = await sb
    .from('registros')
    .select('*, itens_coleta(*, tipos_residuo(nome, unidade))')
    .eq('coleta_id', coletaId)
    .single()
  return data || null
}

export const salvarRegistro = async ({ coletaId, motoristaId, observacao, fotoUrl, itens }) => {
  // 1. Criar ou atualizar registro
  const { data: reg, error: errReg } = await sb
    .from('registros')
    .upsert({ coleta_id: coletaId, motorista_id: motoristaId, observacao, foto_url: fotoUrl, realizado_em: new Date().toISOString() },
            { onConflict: 'coleta_id' })
    .select()
    .single()
  if (errReg) return { error: errReg }

  // 2. Limpar itens antigos e inserir novos
  await sb.from('itens_coleta').delete().eq('registro_id', reg.id)
  if (itens && itens.length > 0) {
    const rows = itens
      .filter(i => i.quantidade > 0)
      .map(i => ({ registro_id: reg.id, tipo_residuo_id: i.tipo_residuo_id, quantidade: i.quantidade, unidade: i.unidade }))
    if (rows.length > 0) {
      const { error: errItens } = await sb.from('itens_coleta').insert(rows)
      if (errItens) return { error: errItens }
    }
  }

  // 3. Marcar coleta como realizada
  await sb.from('coletas').update({ status: 'realizada' }).eq('id', coletaId)

  return { data: reg }
}

export const uploadFoto = async (coletaId, arquivo) => {
  const ext  = arquivo.name.split('.').pop()
  const path = `${coletaId}/${Date.now()}.${ext}`
  const { error } = await sb.storage.from('fotos-coleta').upload(path, arquivo, { upsert: true })
  if (error) return null
  const { data } = sb.storage.from('fotos-coleta').getPublicUrl(path)
  return data.publicUrl
}

// ── Relatório por cliente ─────────────────────────────────────
export const getRelatorioCliente = async (clienteId, dataInicio, dataFim) => {
  const { data } = await sb
    .from('v_coletas')
    .select('*')
    .eq('cliente_id', clienteId)
    .gte('data', dataInicio)
    .lte('data', dataFim)
    .order('data')
  return data || []
}

export const getItensPorPeriodo = async (clienteId, dataInicio, dataFim) => {
  const { data } = await sb
    .from('coletas')
    .select(`
      id, data, status,
      registros (
        id, realizado_em, observacao, foto_url,
        itens_coleta (
          quantidade, unidade,
          tipos_residuo ( nome, categoria )
        )
      ),
      clientes ( nome, endereco )
    `)
    .eq('cliente_id', clienteId)
    .gte('data', dataInicio)
    .lte('data', dataFim)
    .order('data')
  return data || []
}
