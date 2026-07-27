// Mapa unico das rotas do sistema, usado pelo smoke test visual.
// Toda pagina nova do App.tsx deve entrar aqui — e passa a ser testada e fotografada
// automaticamente, sem precisar escrever um teste novo.

export type Rota = {
  slug: string
  nome: string
  path: string
}

export const ROTAS: Rota[] = [
  { slug: 'dashboard', nome: 'Dashboard', path: '/' },
  { slug: 'colaboradores', nome: 'Colaboradores', path: '/colaboradores' },
  { slug: 'feedback', nome: 'Feedback', path: '/feedback' },
  { slug: 'recrutamento', nome: 'Recrutamento', path: '/recrutamento' },
  { slug: 'avaliacao-desempenho', nome: 'Avaliação de Desempenho', path: '/avaliacao-desempenho' },
  { slug: 'turnover', nome: 'Turnover', path: '/turnover' },
  { slug: 'provisao-ferias', nome: 'Provisão de Férias', path: '/provisao-ferias' },
  { slug: 'banco-de-horas', nome: 'Banco de Horas', path: '/banco-de-horas' },
  { slug: 'beneficios', nome: 'Benefícios (VR/VT)', path: '/beneficios' },
  { slug: 'cargos', nome: 'Cargos', path: '/cargos' },
  { slug: 'ocorrencias', nome: 'Ocorrências', path: '/ocorrencias' },
  { slug: 'holerites', nome: 'Holerites', path: '/holerites' },
  { slug: 'treinamentos', nome: 'Treinamentos', path: '/treinamentos' },
  { slug: 'contcoins', nome: 'ContCoins', path: '/contcoins' },
  { slug: 'mural-recados', nome: 'Mural de Recados', path: '/mural-recados' },
  { slug: 'feed-rh', nome: 'Feed RH', path: '/feed-rh' },
  { slug: 'perfil-comportamental', nome: 'Perfil Comportamental', path: '/perfil-comportamental' },
  { slug: 'integracoes', nome: 'Integrações', path: '/integracoes' },
  { slug: 'configuracoes', nome: 'Configurações', path: '/configuracoes' },
]
