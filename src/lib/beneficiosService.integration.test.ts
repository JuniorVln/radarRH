/**
 * Teste de integração: roda o motor de cálculo de verdade contra o Supabase
 * real, usando uma competência descartável ("2099-01") e um colaborador
 * marcado como teste, para não colidir com dados reais de folha. Cria os
 * próprios fixtures e limpa tudo no final (afterAll), mesmo se algum teste
 * falhar no meio.
 *
 * Requer VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (já vêm do .env local).
 * Em CI, essas envs precisam estar configuradas como secrets do repositório.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { supabase } from './supabase'
import { calcularCompetencia, listarEventos, listarResultados, obterOuCriarPeriodo } from './beneficiosService'

const COMPETENCIA_TESTE = '2099-01'
const NOME_COLABORADOR_TESTE = '__TESTE_AUTOMATIZADO__ Beneficios'

let periodoId: string
let periodoObj: Awaited<ReturnType<typeof obterOuCriarPeriodo>>
let colaboradorId: string
let configId: string
let ocorrenciaId: string
let feriasId: string

describe('calcularCompetencia (integração real)', () => {
  beforeAll(async () => {
    // Limpa qualquer resíduo de execuções anteriores que tenham falhado no meio
    const antigo = await supabase.from('colaboradores').select('id').eq('nome', NOME_COLABORADOR_TESTE).maybeSingle()
    if (antigo.data) {
      await supabase.from('colaboradores').delete().eq('id', antigo.data.id)
    }
    const periodoAntigo = await supabase.from('beneficios_periodos').select('id').eq('competencia', COMPETENCIA_TESTE).maybeSingle()
    if (periodoAntigo.data) {
      await supabase.from('beneficios_periodos').delete().eq('id', periodoAntigo.data.id)
    }

    periodoObj = await obterOuCriarPeriodo(COMPETENCIA_TESTE)
    periodoId = periodoObj.id
    expect(periodoObj.periodo_inicio).toBe('2098-11-20')
    expect(periodoObj.periodo_fim).toBe('2098-12-19')

    const { data: colaborador, error: colabErr } = await supabase
      .from('colaboradores')
      .insert({ nome: NOME_COLABORADOR_TESTE, cargo: 'Teste', setor: 'Teste', unidade: 'Rede Ideia', tipo: 'CLT', status: 'ativo' })
      .select()
      .single()
    if (colabErr) throw colabErr
    colaboradorId = colaborador.id

    const { data: config, error: configErr } = await supabase
      .from('beneficios_configuracoes_colaborador')
      .insert({
        colaborador_id: colaboradorId,
        empresa: 'Rede Ideia',
        valor_vr_diario: 31,
        recebe_frutas: false,
        valor_frutas_mensal: 0,
        tipo_transporte: 'TRI',
        valor_vt_diario: 10,
        ativo: true,
      })
      .select()
      .single()
    if (configErr) throw configErr
    configId = config.id

    // 1 falta e 2 dias de férias dentro do período de teste (20/11/2098 a 19/12/2098)
    const { data: ocorrencia, error: ocErr } = await supabase
      .from('ocorrencias')
      .insert({
        colaborador_id: colaboradorId,
        tipo: 'falta',
        data_ocorrencia: '2098-11-25',
        descricao: 'Falta de teste automatizado',
        status: 'resolvida',
      })
      .select()
      .single()
    if (ocErr) throw ocErr
    ocorrenciaId = ocorrencia.id

    const { data: ferias, error: feriasErr } = await supabase
      .from('ferias')
      .insert({
        colaborador_id: colaboradorId,
        periodo_aquisitivo_inicio: '2097-01-01',
        periodo_aquisitivo_fim: '2098-01-01',
        vencimento: '2099-01-01',
        gozo_programado: '2098-12-01',
        dias: 2,
        status: 'gozada',
      })
      .select()
      .single()
    if (feriasErr) throw feriasErr
    feriasId = ferias.id
  })

  afterAll(async () => {
    if (feriasId) await supabase.from('ferias').delete().eq('id', feriasId)
    if (ocorrenciaId) await supabase.from('ocorrencias').delete().eq('id', ocorrenciaId)
    if (periodoId) await supabase.from('beneficios_eventos').delete().eq('periodo_id', periodoId)
    if (periodoId && colaboradorId) {
      await supabase.from('beneficios_resultados').delete().eq('periodo_id', periodoId).eq('colaborador_id', colaboradorId)
    }
    if (configId) await supabase.from('beneficios_configuracoes_colaborador').delete().eq('id', configId)
    if (colaboradorId) await supabase.from('colaboradores').delete().eq('id', colaboradorId)
    if (periodoId) await supabase.from('beneficios_periodos').delete().eq('id', periodoId)
  })

  it('calcula VR/VT descontando a falta e as férias registradas, e grava o detalhamento por dia', async () => {
    await calcularCompetencia(periodoId)

    const resultados = await listarResultados(periodoId)
    const resultado = resultados.find(r => r.colaborador_id === colaboradorId)
    expect(resultado).toBeDefined()

    // VR desconta só faltas+férias (1+2=3 dias). VT desconta os mesmos 3 dias
    // MAIS os dias de home office parcial (seg/sex) — o colaborador de teste
    // usa transporte TRI com VT por dia, que entra no "regime híbrido".
    const diasUteis = resultado!.dias_uteis_vr
    const vrEsperado = Math.round((31 * diasUteis - 31 * 3) * 100) / 100
    const vtEsperado = Math.round((10 * diasUteis - 10 * (3 + periodoObj.dias_home_office)) * 100) / 100

    expect(resultado!.dias_faltas).toBe(1)
    expect(resultado!.dias_ferias).toBe(2)
    expect(resultado!.dias_home_office).toBe(periodoObj.dias_home_office)
    expect(resultado!.total_vr).toBe(vrEsperado)
    expect(resultado!.total_vt).toBe(vtEsperado)

    const eventos = await listarEventos(periodoId, colaboradorId)
    expect(eventos.some(e => e.tipo === 'falta')).toBe(true)
    expect(eventos.some(e => e.tipo === 'ferias')).toBe(true)
  })

  it('recalcular de novo não duplica eventos nem quebra o resultado', async () => {
    await calcularCompetencia(periodoId)
    const eventos = await listarEventos(periodoId, colaboradorId)
    // 1 evento de falta + 1 evento de férias, nunca duplicado por recálculo repetido
    expect(eventos.length).toBe(2)
  })
})
