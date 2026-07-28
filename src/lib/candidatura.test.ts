import { describe, it, expect } from 'vitest'
// @ts-ignore — módulo JS das funções de servidor, sem tipos declarados
import { validarCandidatura, CAMPOS_PUBLICOS, LIMITES } from '../../api/_candidatura.js'

// Testes da validação do formulário PÚBLICO de vagas. É o único ponto do sistema
// que recebe dado de estranho na internet, então vale testar o que ele RECUSA.

const ABERTAS = ['vaga-1', 'vaga-2']

const valida = {
  nome: 'Maria da Silva',
  email: 'maria@exemplo.com',
  telefone: '41999998888',
  vaga_id: 'vaga-1',
}

describe('candidatura pública', () => {
  it('aceita uma candidatura completa e normaliza os dados', () => {
    const r = validarCandidatura(
      { ...valida, email: '  MARIA@Exemplo.com ', mensagem: '  oi  ' },
      ABERTAS,
    )
    expect(r.ok).toBe(true)
    expect(r.dados).toMatchObject({
      nome: 'Maria da Silva',
      email: 'maria@exemplo.com', // minúsculo e sem espaço
      observacoes_internas: 'oi',
      etapa_kanban: 'triagem',
      origem: 'Portal',
    })
  })

  it('recusa vaga que não está aberta — inclusive id chutado', () => {
    expect(validarCandidatura({ ...valida, vaga_id: 'vaga-fechada' }, ABERTAS).ok).toBe(false)
    expect(validarCandidatura({ ...valida, vaga_id: '' }, ABERTAS).ok).toBe(false)
    expect(validarCandidatura({ ...valida, vaga_id: undefined }, ABERTAS).ok).toBe(false)
  })

  it('exige nome, e-mail válido e telefone', () => {
    expect(validarCandidatura({ ...valida, nome: 'Jo' }, ABERTAS).ok).toBe(false)
    expect(validarCandidatura({ ...valida, email: 'sem-arroba' }, ABERTAS).ok).toBe(false)
    expect(validarCandidatura({ ...valida, email: 'a@b' }, ABERTAS).ok).toBe(false)
    expect(validarCandidatura({ ...valida, telefone: '' }, ABERTAS).ok).toBe(false)
  })

  it('barra o robô pelo campo-armadilha, e em silêncio', () => {
    const r = validarCandidatura({ ...valida, site: 'http://spam.example' }, ABERTAS)
    expect(r.ok).toBe(false)
    // silencioso = a função HTTP responde 200 para o robô não aprender que foi pego
    expect(r.silencioso).toBe(true)
  })

  it('recusa link de currículo que não é http', () => {
    const r = validarCandidatura({ ...valida, curriculo: 'javascript:alert(1)' }, ABERTAS)
    expect(r.ok).toBe(false)
  })

  it('corta texto gigante em vez de aceitar payload sem limite', () => {
    const r = validarCandidatura({ ...valida, mensagem: 'x'.repeat(50000) }, ABERTAS)
    expect(r.ok).toBe(true)
    expect(r.dados.observacoes_internas.length).toBe(LIMITES.mensagem)
  })

  it('não quebra com envio vazio ou lixo', () => {
    expect(validarCandidatura(null, ABERTAS).ok).toBe(false)
    expect(validarCandidatura('texto', ABERTAS).ok).toBe(false)
    expect(validarCandidatura({}, ABERTAS).ok).toBe(false)
  })

  it('não expõe salário nos campos públicos da vaga', () => {
    // Publicar faixa salarial é decisão do RH, não padrão do sistema.
    expect(CAMPOS_PUBLICOS).not.toContain('salario_min')
    expect(CAMPOS_PUBLICOS).not.toContain('salario_max')
    expect(CAMPOS_PUBLICOS).toContain('titulo')
  })
})
