// Seed único: importa os colaboradores reais e os dados históricos de maio/2026
// (extraídos da planilha "Benefícios - 05-26.xlsx" da Deise) para o Supabase,
// para que a automação de Benefícios (Ocorrências + Férias -> cálculo) tenha
// dados reais de onde puxar em vez de um arquivo estático no código.
//
// Rodar uma única vez: node scripts/seed-beneficios-maio-2026.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf-8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
    })
)

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_KEY)

// ---- Dados originais da planilha (Fase 01 / Especificação de Regras de Benefícios) ----
const COLABORADORES = [
  { nome: 'ALINE DIAS DE BRITO', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'HOME OFFICE' },
  { nome: 'AMANDA DA ROSA FERRÃO', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'COMBUSTIVEL', valorVtDiario: 15.5 },
  { nome: 'BRUNO DA SILVA CAMARA', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'HOME OFFICE', diasFerias: 19, diasFaltas: 1 },
  { nome: 'CAROLINE KARNAL DOS SANTOS', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'COMBUSTIVEL', valorVtDiario: 10.6, diasHomeOffice: 8 },
  { nome: 'CAROLYNE COSTA MACHADO', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'HOME OFFICE' },
  { nome: 'DANIELLY RENATA HERZER', empresa: 'Rede Ideia', localidade: 'Brochier', valorVrDiario: 31, recebeFrutas: true, valorFrutasMensal: 20, transporte: 'BROCHIER', diasFeriadosRegionais: 1 },
  { nome: 'DEISE DA SILVA HUNGER', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'TRI', valorVtDiario: 10.6, diasHomeOffice: 8 },
  { nome: 'EDUARDA BLANCO AIMONE', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'TEU', valorVtDiario: 17.6, diasHomeOffice: 8, diasFaltas: 1 },
  { nome: 'EVELIN EMILY DE OLIVEIRA', empresa: 'Rede Ideia', valorVrDiario: 31, recebeFrutas: true, valorFrutasMensal: 20, transporte: 'BROCHIER', diasFaltas: 2 },
  { nome: 'GABRIEL AREND PIRES', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'TRI', valorVtDiario: 10.6, diasHomeOffice: 8 },
  { nome: 'GABRIELA MARQUES DA SILVA', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'COMBUSTIVEL', valorVtDiario: 10.6, diasHomeOffice: 8 },
  { nome: 'GUILHERME MARTINS PROTAS', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'HOME OFFICE' },
  { nome: 'ISADORA DA MAIA HUNGER', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'COMBUSTIVEL', valorVtDiario: 10.6, diasHomeOffice: 8 },
  { nome: 'JANAIARA DE MATTOS MENEZES', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'TRI', valorVtDiario: 10.6, diasHomeOffice: 8, diasFaltas: 1 },
  { nome: 'JESSICA DA CUNHA ALVES', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'COMBUSTIVEL', valorVtDiario: 10.6, diasHomeOffice: 8 },
  { nome: 'JESSICA DA SILVA DUARTE', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'HOME OFFICE' },
  { nome: 'JOSIANE MACHADO ALVES', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'COMBUSTIVEL', valorVtDiario: 19.6, diasHomeOffice: 8 },
  { nome: 'JULIA MENEZES DE FREITAS', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'TRI', valorVtDiario: 10.6, diasHomeOffice: 8 },
  { nome: 'KETHELYN OLIVEIRA PINTO', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'HOME OFFICE' },
  { nome: 'LAIS DA SILVA EVALDT PURZEL', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'COMBUSTIVEL', valorVtDiario: 17.6, diasHomeOffice: 8 },
  { nome: 'LAURA DA SILVA FERNANDES', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'TRI', valorVtDiario: 10.6, diasHomeOffice: 8 },
  { nome: 'MITALLY NAZARIO', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'HOME OFFICE' },
  { nome: 'MORGANA ASSIS DA SILVA', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'TEU', valorVtDiario: 20.6, diasHomeOffice: 8 },
  { nome: 'NATANIELE COSTA DA SILVEIRA', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'TRI', valorVtDiario: 10.6, diasHomeOffice: 8 },
  { nome: 'NATASHA LIPPERT VARELA', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'TEU', valorVtDiario: 24.2, semVtNestaCompetencia: true },
  { nome: 'NAYANE ARAUJO PREZZI', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'COMBUSTIVEL', valorVtDiario: 10.6, diasHomeOffice: 8 },
  { nome: 'PRICILLA IBARRA RANGEL', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'COMBUSTIVEL', valorVtDiario: 10.6, diasHomeOffice: 8 },
  { nome: 'RAFAELA ROSONI DA SILVA', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'TRI', valorVtDiario: 10.6, diasUteisVtOriginal: 24 },
  { nome: 'RAISSA ALANIS GENTZ VIANA', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'TRI', valorVtDiario: 10.6, diasHomeOffice: 8 },
  { nome: 'RENE MICHEL DE SOUZA', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'TEU', valorVtDiario: 35.9, diasHomeOffice: 8 },
  { nome: 'TAINA LACERDA RODRIGUES', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'TRI', valorVtDiario: 10.6, semVtNestaCompetencia: true },
  { nome: 'TALITA CARDOSO BUCHMANN', empresa: 'Rede Ideia', valorVrDiario: 31, recebeFrutas: true, valorFrutasMensal: 20, transporte: 'BROCHIER', diasFaltas: 2 },
  { nome: 'VANESSA BENZ DE SOUZA', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'COMBUSTIVEL', valorVtDiario: 10.6, diasHomeOffice: 8 },
  { nome: 'VINICIUS COLARES PAIVA', empresa: 'Rede Ideia', valorVrDiario: 0, transporte: 'TRI', valorVtDiario: 10.6, diasHomeOffice: 8 },
  { nome: 'WILLIAM DA SILVA CAMARA', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'HOME OFFICE' },

  { nome: 'ALESSANDRO DE LIMA CANABARRO', empresa: 'Rede Gaucha', valorVrDiario: 31, transporte: 'COMBUSTIVEL', valorVtDiario: 20.2, diasHomeOffice: 8, diasFaltas: 1 },
  { nome: 'AMANDA FRAGA EMERIM', empresa: 'Rede Gaucha', valorVrDiario: 31, transporte: 'COMBUSTIVEL', vtFixoMensal: 500 },
  { nome: 'ANA CAROLINE BATISTA DA SILVA LODI', empresa: 'Rede Gaucha', valorVrDiario: 31, transporte: 'TEU', valorVtDiario: 20, semVtNestaCompetencia: true },
  { nome: 'ANA ELISE NUNES', empresa: 'Rede Gaucha', valorVrDiario: 0, transporte: 'COMBUSTIVEL' },
  { nome: 'ANDERSON DA ROSA FERRÃO', empresa: 'Rede Gaucha', valorVrDiario: 31, transporte: 'HOME OFFICE' },
  { nome: 'ANDRESSA LUANA FELIPE DA SILVA', empresa: 'Rede Gaucha', valorVrDiario: 31, recebeFrutas: true, valorFrutasMensal: 20, transporte: 'COMBUSTIVEL', valorVtDiario: 8 },
  { nome: 'ARIEL CRISTIANI MANGONI BARBOSA', empresa: 'Rede Gaucha', valorVrDiario: 31, transporte: 'COMBUSTIVEL', valorVtDiario: 20.2, diasHomeOffice: 8 },
  { nome: 'DANIELE SANTIAGO', empresa: 'Rede Gaucha', valorVrDiario: 31, transporte: 'HOME OFFICE', diasFaltas: 1 },
  { nome: 'ELLEN SCHAURICH MULLER', empresa: 'Rede Gaucha', valorVrDiario: 31, transporte: 'TEU', valorVtDiario: 25.5, ajusteManualVtOriginal: 361, motivoAjuste: 'Regra específica do TEU (planilha original: bruto ~510, líquido 361)' },
  { nome: 'EDUARDA BRUSCH KLEIN', empresa: 'Rede Gaucha', valorVrDiario: 0, transporte: 'TRI', valorVtDiario: 10.6, diasHomeOffice: 8 },
  { nome: 'FLAVIA GABRIELE BOGEA DOS SANTOS', empresa: 'Rede Gaucha', valorVrDiario: 31, recebeFrutas: true, valorFrutasMensal: 20, transporte: 'TRI', valorVtDiario: 10.6, diasFaltas: 3 },
  { nome: 'GABRIELLE ALMANSA NUNES FLORISBAL', empresa: 'Rede Gaucha', valorVrDiario: 31, transporte: 'COMBUSTIVEL', valorVtDiario: 10.6, diasFaltas: 2 },
  { nome: 'ISABELA CORREA SANTOS', empresa: 'Rede Gaucha', valorVrDiario: 31, transporte: 'COMBUSTIVEL', valorVtDiario: 10.6 },
  { nome: 'JENIFFER CAMPOS CRISTOVÃO', empresa: 'Rede Gaucha', valorVrDiario: 31, transporte: 'COMBUSTIVEL', valorVtDiario: 10.6 },
  { nome: 'KALINA HEPP SOKOLOV', empresa: 'Rede Gaucha', valorVrDiario: 31, transporte: 'TRI', valorVtDiario: 10.6, diasHomeOffice: 8 },
  { nome: 'LUIZA ADRIANA ERNEST DUARTE', empresa: 'Rede Gaucha', valorVrDiario: 31, transporte: 'TRI', valorVtDiario: 10.6 },
  { nome: 'RODRIGO ALVES DE FREITAS', empresa: 'Rede Gaucha', valorVrDiario: 31, transporte: 'TRI', valorVtDiario: 10.6, diasHomeOffice: 8 },
  { nome: 'SUZANA CARVALHO MARZANO', empresa: 'Rede Gaucha', valorVrDiario: 31, transporte: 'COMBUSTIVEL', valorVtDiario: 10.6 },
  { nome: 'TAIS CAROLINI DOS SANTOS', empresa: 'Rede Gaucha', valorVrDiario: 31, recebeFrutas: true, valorFrutasMensal: 20, transporte: 'BROCHIER', diasFeriadosRegionais: 1 },

  { nome: 'ARTHUR FREITAS BORBA', empresa: 'Business', valorVrDiario: 31, transporte: 'TRI', valorVtDiario: 10.6, diasHomeOffice: 8 },
  { nome: 'BIANCA DA SILVA DIAS', empresa: 'Business', valorVrDiario: 31, transporte: 'COMBUSTIVEL', valorVtDiario: 10.6, diasHomeOffice: 8 },
  { nome: 'DIENIFFER RODRIGUES DA SILVA', empresa: 'Business', valorVrDiario: 31, transporte: 'COMBUSTIVEL', valorVtDiario: 10.6, diasHomeOffice: 8, diasFaltas: 4 },
  { nome: 'JOSE GABRIEL DA SILVA', empresa: 'Business', valorVrDiario: 31, transporte: 'TEU', valorVtDiario: 10 },
  { nome: 'LUCAS SCHWINGEL DE OLIVEIRA', empresa: 'Business', valorVrDiario: 31, transporte: 'HOME OFFICE', diasFaltas: 1 },
  { nome: 'ROGER EVALDT DA SILVA', empresa: 'Business', valorVrDiario: 31, transporte: 'HOME OFFICE' },
  { nome: 'STEPHANE FREITAS ARAUJO', empresa: 'Business', valorVrDiario: 31, transporte: 'TRI', valorVtDiario: 10.6 },

  { nome: 'DANIELE HORLAT', empresa: 'Prosperar', valorVrDiario: 31, recebeFrutas: true, valorFrutasMensal: 20, transporte: 'COMBUSTIVEL', valorVtDiario: 12, diasHomeOffice: 8 },
  { nome: 'EVELIM VITICOSKI DOS SANTOS', empresa: 'Prosperar', valorVrDiario: 31, recebeFrutas: true, valorFrutasMensal: 20, transporte: 'COMBUSTIVEL', valorVtDiario: 18.7, diasHomeOffice: 8 },
  { nome: 'MARITA RODRIGUES', empresa: 'Prosperar', valorVrDiario: 31, recebeFrutas: true, valorFrutasMensal: 20, transporte: 'COMBUSTIVEL', valorVtDiario: 19.6, diasHomeOffice: 8 },
  { nome: 'RAQUEL BITENCOURTE DOS SANTOS', empresa: 'Prosperar', valorVrDiario: 31, recebeFrutas: true, valorFrutasMensal: 20, transporte: 'COMBUSTIVEL', valorVtDiario: 12, diasHomeOffice: 8 },
  { nome: 'TAINARA PEREIRA DE OLIVEIRA', empresa: 'Prosperar', valorVrDiario: 31, recebeFrutas: true, valorFrutasMensal: 20, transporte: 'TEU', valorVtDiario: 21.8, diasHomeOffice: 8, diasFaltas: 2 },
]

const COMPETENCIA = '2026-05'
const PERIODO_INICIO = '2026-03-20'
const PERIODO_FIM = '2026-04-19'
const FERIADOS_REGIONAIS = [{ data: '2026-04-17', localidade: 'Brochier', descricao: 'Feriado Brochier' }]

function contarDiasUteis(inicio, fim) {
  const [yi, mi, di] = inicio.split('-').map(Number)
  const [yf, mf, df] = fim.split('-').map(Number)
  let total = 0
  for (let d = new Date(yi, mi - 1, di); d <= new Date(yf, mf - 1, df); d.setDate(d.getDate() + 1)) {
    const day = d.getDay()
    if (day !== 0 && day !== 6) total += 1
  }
  return total
}

function contarDiasHomeOffice(inicio, fim) {
  const [yi, mi, di] = inicio.split('-').map(Number)
  const [yf, mf, df] = fim.split('-').map(Number)
  let total = 0
  for (let d = new Date(yi, mi - 1, di); d <= new Date(yf, mf - 1, df); d.setDate(d.getDate() + 1)) {
    const day = d.getDay()
    if (day === 1 || day === 5) total += 1
  }
  return total
}

function normalizarNome(nome) {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .trim()
}

async function main() {
  console.log('1) Período de folha', COMPETENCIA)
  const diasUteis = contarDiasUteis(PERIODO_INICIO, PERIODO_FIM)
  const diasHomeOffice = contarDiasHomeOffice(PERIODO_INICIO, PERIODO_FIM)
  console.log(`   ${PERIODO_INICIO} a ${PERIODO_FIM} -> ${diasUteis} dias úteis, ${diasHomeOffice} home office (seg+sex)`)

  let { data: periodo } = await supabase.from('beneficios_periodos').select('*').eq('competencia', COMPETENCIA).maybeSingle()
  if (!periodo) {
    const { data, error } = await supabase
      .from('beneficios_periodos')
      .insert({
        competencia: COMPETENCIA,
        periodo_inicio: PERIODO_INICIO,
        periodo_fim: PERIODO_FIM,
        dias_uteis: diasUteis,
        dias_home_office: diasHomeOffice,
        feriados_nacionais: [],
        feriados_regionais: FERIADOS_REGIONAIS,
        status: 'aberto',
      })
      .select()
      .single()
    if (error) throw error
    periodo = data
    console.log('   Período criado:', periodo.id)
  } else {
    console.log('   Período já existia:', periodo.id)
  }

  console.log('\n2) Colaboradores existentes no banco')
  const { data: existentes, error: existentesErr } = await supabase.from('colaboradores').select('*')
  if (existentesErr) throw existentesErr
  const existentesPorNome = new Map(existentes.map(c => [normalizarNome(c.nome), c]))
  console.log(`   ${existentes.length} colaboradores já cadastrados`)

  const resultado = { criados: 0, reaproveitados: 0 }
  const colaboradorIdPorNome = new Map()

  for (const item of COLABORADORES) {
    const chave = normalizarNome(item.nome)
    const jaExiste = existentesPorNome.get(chave)
    if (jaExiste) {
      colaboradorIdPorNome.set(item.nome, jaExiste.id)
      resultado.reaproveitados += 1
      continue
    }
    const { data, error } = await supabase
      .from('colaboradores')
      .insert({
        nome: item.nome,
        cargo: 'A definir',
        setor: 'A definir',
        unidade: item.empresa,
        tipo: 'CLT',
        status: 'ativo',
      })
      .select()
      .single()
    if (error) throw error
    colaboradorIdPorNome.set(item.nome, data.id)
    resultado.criados += 1
  }
  console.log(`   ${resultado.criados} colaboradores criados, ${resultado.reaproveitados} já existiam (reaproveitados)`)

  console.log('\n3) Configurações de benefícios (VR/VT/frutas por colaborador)')
  const { data: configsExistentes } = await supabase.from('beneficios_configuracoes_colaborador').select('colaborador_id')
  const jaConfigurados = new Set((configsExistentes || []).map(c => c.colaborador_id))
  let configsCriadas = 0
  for (const item of COLABORADORES) {
    const colaboradorId = colaboradorIdPorNome.get(item.nome)
    if (jaConfigurados.has(colaboradorId)) continue
    const { error } = await supabase.from('beneficios_configuracoes_colaborador').insert({
      colaborador_id: colaboradorId,
      empresa: item.empresa,
      localidade: item.localidade || null,
      valor_vr_diario: item.valorVrDiario,
      recebe_frutas: Boolean(item.recebeFrutas),
      valor_frutas_mensal: item.valorFrutasMensal || 0,
      tipo_transporte: item.transporte,
      valor_vt_diario: item.valorVtDiario || 0,
      vt_fixo_mensal: item.vtFixoMensal || null,
      ativo: true,
    })
    if (error) throw error
    configsCriadas += 1
  }
  console.log(`   ${configsCriadas} configurações criadas`)

  console.log('\n4) Ocorrências (faltas) dentro do período — para a puxada automática')
  const { data: ocorrenciasExistentes } = await supabase
    .from('ocorrencias')
    .select('colaborador_id, descricao')
    .eq('descricao', 'Falta - importado da planilha de maio/2026 (Deise, 28/04/2026)')
  const colabsComFaltaImportada = new Set((ocorrenciasExistentes || []).map(o => o.colaborador_id))
  let ocorrenciasCriadas = 0
  for (const item of COLABORADORES) {
    if (!item.diasFaltas) continue
    const colaboradorId = colaboradorIdPorNome.get(item.nome)
    if (colabsComFaltaImportada.has(colaboradorId)) continue
    // A planilha só guarda a CONTAGEM de dias, não as datas exatas — distribuídas
    // em dias úteis do período para o motor de cálculo conseguir contá-las de volta.
    const datasUteis = []
    for (let d = new Date(2026, 2, 20); d <= new Date(2026, 3, 19) && datasUteis.length < item.diasFaltas; d.setDate(d.getDate() + 1)) {
      const day = d.getDay()
      if (day !== 0 && day !== 6) datasUteis.push(new Date(d))
    }
    const linhas = datasUteis.slice(0, item.diasFaltas).map(d => ({
      colaborador_id: colaboradorId,
      tipo: 'falta',
      data_ocorrencia: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      severidade: 'baixa',
      descricao: 'Falta - importado da planilha de maio/2026 (Deise, 28/04/2026)',
      status: 'resolvida',
    }))
    const { error } = await supabase.from('ocorrencias').insert(linhas)
    if (error) throw error
    ocorrenciasCriadas += linhas.length
  }
  console.log(`   ${ocorrenciasCriadas} ocorrências de falta criadas`)

  console.log('\n5) Férias dentro do período')
  const { data: feriasExistentes } = await supabase
    .from('ferias')
    .select('colaborador_id')
    .eq('periodo_aquisitivo_inicio', '2025-05-01')
  const colabsComFeriasImportadas = new Set((feriasExistentes || []).map(f => f.colaborador_id))
  let feriasCriadas = 0
  for (const item of COLABORADORES) {
    if (!item.diasFerias) continue
    const colaboradorId = colaboradorIdPorNome.get(item.nome)
    if (colabsComFeriasImportadas.has(colaboradorId)) continue
    const { error } = await supabase.from('ferias').insert({
      colaborador_id: colaboradorId,
      periodo_aquisitivo_inicio: '2025-05-01',
      periodo_aquisitivo_fim: '2026-04-30',
      vencimento: '2026-06-30',
      gozo_programado: PERIODO_INICIO,
      dias: item.diasFerias,
      status: 'gozada',
    })
    if (error) throw error
    feriasCriadas += 1
  }
  console.log(`   ${feriasCriadas} registros de férias criados`)

  console.log('\nPronto. Casos atípicos (ajuste manual da Ellen/Natasha/Taina/Rafaela) devem ser')
  console.log('lançados na UI depois de rodar "Recalcular" pela primeira vez (dependem do id do resultado).')
}

main().catch(err => {
  console.error('Erro no seed:', err)
  process.exit(1)
})
