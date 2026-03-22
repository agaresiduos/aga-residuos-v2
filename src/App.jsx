import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import AgendaMotorista from './pages/AgendaMotorista'
import RegistroColeta from './pages/RegistroColeta'
import AgendaGestor from './pages/AgendaGestor'
import PainelGestor from './pages/PainelGestor'
import RelatorioCliente from './pages/RelatorioCliente'

function RotaProtegida({ children, perfil }) {
  const { usuario, carregando } = useAuth()
  if (carregando) return <div className="min-h-screen flex items-center justify-center text-navy-300">Carregando...</div>
  if (!usuario) return <Navigate to="/login" replace />
  if (perfil && usuario.perfil !== perfil) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { usuario, carregando } = useAuth()

  if (carregando) return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center">
      <div className="text-navy-300 text-sm tracking-widest font-semibold animate-pulse">CARREGANDO...</div>
    </div>
  )

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Rotas do motorista */}
      <Route path="/motorista" element={
        <RotaProtegida perfil="motorista"><AgendaMotorista /></RotaProtegida>
      }/>
      <Route path="/motorista/coleta/:id" element={
        <RotaProtegida perfil="motorista"><RegistroColeta /></RotaProtegida>
      }/>

      {/* Rotas do gestor */}
      <Route path="/gestor" element={
        <RotaProtegida perfil="gestor"><AgendaGestor /></RotaProtegida>
      }/>
      <Route path="/gestor/painel" element={
        <RotaProtegida perfil="gestor"><PainelGestor /></RotaProtegida>
      }/>
      <Route path="/gestor/relatorio" element={
        <RotaProtegida perfil="gestor"><RelatorioCliente /></RotaProtegida>
      }/>

      {/* Redirect raiz */}
      <Route path="/" element={
        usuario
          ? <Navigate to={usuario.perfil === 'gestor' ? '/gestor' : '/motorista'} replace />
          : <Navigate to="/login" replace />
      }/>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
