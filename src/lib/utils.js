// Datas
export const hoje = () => new Date().toISOString().slice(0, 10)

export const fmtData = (iso) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export const fmtDataLonga = (iso) => {
  if (!iso) return ''
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export const fmtHora = (time) => {
  if (!time) return ''
  return time.slice(0, 5)
}

export const fmtRelativo = (isoStr) => {
  if (!isoStr) return ''
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000)
  if (diff < 1)  return 'agora'
  if (diff < 60) return `há ${diff} min`
  return `há ${Math.floor(diff / 60)}h`
}

export const getMesesNome = () => [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
]

export const getDiasNome = () => ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

// Calendário
export const getDiasDoMes = (date) => {
  const ano = date.getFullYear()
  const mes = date.getMonth()
  const primeiro = new Date(ano, mes, 1)
  const inicio = new Date(primeiro)
  inicio.setDate(inicio.getDate() - inicio.getDay())
  const dias = []
  for (let i = 0; i < 28; i++) {
    const d = new Date(inicio)
    d.setDate(inicio.getDate() + i)
    dias.push({
      iso: d.toISOString().slice(0, 10),
      outroMes: d.getMonth() !== mes,
    })
  }
  return dias
}

// Status
export const STATUS = {
  pendente:   { label: 'Pendente',   cor: '#F59E0B', classe: 'badge-pendente' },
  realizada:  { label: 'Realizada',  cor: '#22C55E', classe: 'badge-realizada' },
  reagendada: { label: 'Reagendada', cor: '#818CF8', classe: 'badge-reagendada' },
  cancelada:  { label: 'Cancelada',  cor: '#EF4444', classe: 'badge-cancelada' },
}

// Categorias de resíduo
export const CATEGORIAS = {
  reciclavel: { label: 'Reciclável', cor: '#2DD4BF' },
  organico:   { label: 'Orgânico',   cor: '#22C55E' },
  rejeito:    { label: 'Rejeito',    cor: '#94A3B8' },
  perigoso:   { label: 'Perigoso',   cor: '#F87171' },
  outro:      { label: 'Outro',      cor: '#A78BFA' },
}

// Frequências
export const FREQUENCIAS = {
  unica:      'Única vez',
  semanal:    'Semanal',
  quinzenal:  'Quinzenal',
  mensal:     'Mensal',
}

// Cores para motoristas
export const CORES_MOT = [
  '#2A5298','#2D9C45','#E67E22','#8E44AD',
  '#E91E8C','#16A085','#D4AC0D','#2471A3',
]

// Gerar datas recorrentes
export const gerarDatas = (dataInicio, frequencia, diasSemana = [], semanas = 8) => {
  if (frequencia === 'unica') return [dataInicio]

  const result = []
  const dtI = new Date(dataInicio + 'T12:00:00')
  const dtF = new Date(dataInicio + 'T12:00:00')
  dtF.setDate(dtF.getDate() + (parseInt(semanas) || 8) * 7)

  if (frequencia === 'semanal' || frequencia === 'quinzenal') {
    const passo = frequencia === 'quinzenal' ? 14 : 7
    const ds = diasSemana.length > 0 ? diasSemana : [dtI.getDay()]
    ds.forEach((diaSem) => {
      const cur = new Date(dtI)
      cur.setDate(cur.getDate() + ((diaSem - cur.getDay() + 7) % 7))
      while (cur <= dtF) {
        const s = cur.toISOString().slice(0, 10)
        if (s >= dataInicio && !result.includes(s)) result.push(s)
        cur.setDate(cur.getDate() + passo)
      }
    })
  } else if (frequencia === 'mensal') {
    const cur = new Date(dtI)
    while (cur <= dtF) {
      result.push(cur.toISOString().slice(0, 10))
      cur.setMonth(cur.getMonth() + 1)
    }
  }

  return result.sort()
}

// Agrupar por data
export const agruparPorData = (lista) => {
  const g = {}
  lista.forEach((c) => {
    if (!g[c.data]) g[c.data] = []
    g[c.data].push(c)
  })
  return Object.entries(g)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, coletas]) => ({ data, coletas }))
}
