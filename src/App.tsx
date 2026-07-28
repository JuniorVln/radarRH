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

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/colaboradores" element={<ColaboradoresPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/recrutamento" element={<RecrutamentoPage />} />
        <Route path="/avaliacao-desempenho" element={<AvaliacaoDesempenhoPage />} />
        <Route path="/turnover" element={<TurnoverPage />} />
        <Route path="/provisao-ferias" element={<ProvisaoFeriasPage />} />
        <Route path="/banco-de-horas" element={<BancoHorasPage />} />
        <Route path="/beneficios" element={<BeneficiosPage />} />
        <Route path="/cargos" element={<CargosPage />} />
        <Route path="/ocorrencias" element={<OcorrenciasPage />} />
        <Route path="/holerites" element={<HoleritesPage />} />
        <Route path="/treinamentos" element={<TreinamentosPage />} />
        <Route path="/contcoins" element={<ContCoinsPage />} />
        <Route path="/mural-recados" element={<MuralRecadosPage />} />
        <Route path="/feed-rh" element={<FeedRHPage />} />
        <Route path="/perfil-comportamental" element={<PerfilComportamentalPage />} />
        <Route path="/integracoes" element={<IntegracoesPage />} />
        <Route path="/configuracoes" element={<ConfiguracoesPage />} />
        {/* Publica, sem Layout: quem responde e o colaborador/candidato, que nao pode
            ver o menu do RH nem os dados de mais ninguem. */}
        <Route path="/disc/:token" element={<DiscQuestionarioPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
