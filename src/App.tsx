import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import { DashboardPage } from './pages/DashboardPage'
import { ColaboradoresPage } from './pages/ColaboradoresPage'
import { FeedbackPage } from './pages/FeedbackPage'
import { RecrutamentoPage } from './pages/RecrutamentoPage'
import { AvaliacaoDesempenhoPage } from './pages/AvaliacaoDesempenhoPage'
import { TurnoverPage } from './pages/TurnoverPage'
import { ProvisaoFeriasPage } from './pages/ProvisaoFeriasPage'
import { BancoHorasPage } from './pages/BancoHorasPage'
import { BeneficiosPage } from './pages/BeneficiosPage'
import { CargosPage } from './pages/CargosPage'
import { OcorrenciasPage } from './pages/OcorrenciasPage'
import { HoleritesPage } from './pages/HoleritesPage'
import { TreinamentosPage } from './pages/TreinamentosPage'
import { ContCoinsPage } from './pages/ContCoinsPage'
import { MuralRecadosPage } from './pages/MuralRecadosPage'
import { FeedRHPage } from './pages/FeedRHPage'
import { PerfilComportamentalPage } from './pages/PerfilComportamentalPage'
import { ConfiguracoesPage } from './pages/ConfiguracoesPage'
import { IntegracoesPage } from './pages/IntegracoesPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { DiscQuestionarioPage } from './pages/DiscQuestionarioPage'
import { LoginPage } from './pages/LoginPage'
import { DefinirSenhaPage } from './pages/DefinirSenhaPage'
import { ProvedorSessao } from './lib/sessao'
import { RotaProtegida } from './components/RotaProtegida'

export default function App() {
  return (
    <BrowserRouter>
      <ProvedorSessao>
      <Toaster position="top-right" />
      <Routes>
        {/* Publicas: sao a porta de entrada. Nao podem exigir sessao, senao ninguem entra. */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/definir-senha" element={<DefinirSenhaPage />} />

        <Route path="/" element={<RotaProtegida><DashboardPage /></RotaProtegida>} />
        <Route path="/colaboradores" element={<RotaProtegida><ColaboradoresPage /></RotaProtegida>} />
        <Route path="/feedback" element={<RotaProtegida><FeedbackPage /></RotaProtegida>} />
        <Route path="/recrutamento" element={<RotaProtegida><RecrutamentoPage /></RotaProtegida>} />
        <Route path="/avaliacao-desempenho" element={<RotaProtegida><AvaliacaoDesempenhoPage /></RotaProtegida>} />
        <Route path="/turnover" element={<RotaProtegida><TurnoverPage /></RotaProtegida>} />
        <Route path="/provisao-ferias" element={<RotaProtegida><ProvisaoFeriasPage /></RotaProtegida>} />
        <Route path="/banco-de-horas" element={<RotaProtegida><BancoHorasPage /></RotaProtegida>} />
        <Route path="/beneficios" element={<RotaProtegida><BeneficiosPage /></RotaProtegida>} />
        <Route path="/cargos" element={<RotaProtegida><CargosPage /></RotaProtegida>} />
        <Route path="/ocorrencias" element={<RotaProtegida><OcorrenciasPage /></RotaProtegida>} />
        <Route path="/holerites" element={<RotaProtegida><HoleritesPage /></RotaProtegida>} />
        <Route path="/treinamentos" element={<RotaProtegida><TreinamentosPage /></RotaProtegida>} />
        <Route path="/contcoins" element={<RotaProtegida><ContCoinsPage /></RotaProtegida>} />
        <Route path="/mural-recados" element={<RotaProtegida><MuralRecadosPage /></RotaProtegida>} />
        <Route path="/feed-rh" element={<RotaProtegida><FeedRHPage /></RotaProtegida>} />
        <Route path="/perfil-comportamental" element={<RotaProtegida><PerfilComportamentalPage /></RotaProtegida>} />
        <Route path="/integracoes" element={<RotaProtegida><IntegracoesPage /></RotaProtegida>} />
        <Route path="/configuracoes" element={<RotaProtegida><ConfiguracoesPage /></RotaProtegida>} />
        {/* Publica, sem Layout: quem responde e o colaborador/candidato, que nao pode
            ver o menu do RH nem os dados de mais ninguem. */}
        <Route path="/disc/:token" element={<DiscQuestionarioPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </ProvedorSessao>
    </BrowserRouter>
  )
}
