import { describe, it, expect } from 'vitest'
// @ts-ignore — módulo JS da função de servidor, sem tipos declarados
import { encontrarUsuario, partesDoNome } from '../../api/_conectaRI.js'

// Casamento de nome entre o cadastro do RH e o Conecta RI.
// O que mais importa aqui é o que a função RECUSA: mandar mensagem para a pessoa
// errada é pior do que não mandar.

const u = (name: string, username: string) => ({ name, username })

const USUARIOS = [
  u('Ana Caroline Batista', 'Ana.Caroline'),
  u('Arthur Freitas', 'Arthur.Freitas'),
  u('José Gabriel', 'Jose.Gabriel'),
  u('Raissa Viana', 'RaissaViana'),
]

describe('partesDoNome', () => {
  it('tira acento, pontuação e as ligações que não identificam ninguém', () => {
    expect(partesDoNome('ANA CAROLINE BATISTA DA SILVA LODI')).toEqual([
      'ana', 'caroline', 'batista', 'silva', 'lodi',
    ])
    expect(partesDoNome('José  Gabriel')).toEqual(['jose', 'gabriel'])
  })
})

describe('encontrarUsuario', () => {
  it('acha mesmo com o nome do cadastro sendo mais longo', () => {
    const r = encontrarUsuario('ANA CAROLINE BATISTA DA SILVA LODI', USUARIOS)
    expect(r.usuario.username).toBe('Ana.Caroline')
  })

  it('ignora acento e caixa', () => {
    expect(encontrarUsuario('jose gabriel', USUARIOS).usuario.username).toBe('Jose.Gabriel')
  })

  it('não inventa quando a pessoa não está no Conecta RI', () => {
    const r = encontrarUsuario('Fulano de Tal', USUARIOS)
    expect(r.usuario).toBeUndefined()
    expect(r.erro).toMatch(/não encontrei/i)
  })

  it('NÃO escolhe quando há dois candidatos — devolve ambiguidade', () => {
    // Este é o caso perigoso: dois "Ana Caroline" e o sistema mandando pra qualquer um.
    const doisAnas = [...USUARIOS, u('Ana Caroline Souza', 'Ana.Souza')]
    const r = encontrarUsuario('Ana Caroline', doisAnas)
    expect(r.usuario).toBeUndefined()
    expect(r.ambiguos).toHaveLength(2)
    expect(r.erro).toMatch(/mais de uma pessoa/i)
  })

  it('primeiro nome igual mas sobrenome diferente não casa', () => {
    const r = encontrarUsuario('Arthur Mendonça', [u('Arthur Freitas', 'Arthur.Freitas')])
    expect(r.usuario).toBeUndefined()
  })

  it('não quebra com lista vazia ou nome vazio', () => {
    expect(encontrarUsuario('Ana', []).erro).toBeTruthy()
    expect(encontrarUsuario('', USUARIOS).erro).toBeTruthy()
    expect(encontrarUsuario('Ana', null as any).erro).toBeTruthy()
  })
})
