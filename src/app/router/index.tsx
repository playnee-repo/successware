import { createBrowserRouter, Navigate } from 'react-router-dom'
import { DashboardPage } from '@/pages/dashboard/ui/DashboardPage'
import { ProjectPage } from '@/pages/project/ui/ProjectPage'
import { ResultadoPage } from '@/pages/resultado/ui/ResultadoPage'
import { AdminPage } from '@/pages/admin/ui/AdminPage'
import { DocumentosPage } from '@/pages/documentos/ui/DocumentosPage'
import { LoginPage } from '@/pages/login/ui/LoginPage'
import { MembrosPage } from '@/pages/membros/ui/MembrosPage'
import { ProtectedRoute, PermissionRoute } from './ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    // Rotas protegidas — requer autenticação
    element: <ProtectedRoute />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/project/:projectId', element: <ProjectPage /> },
      { path: '/project/:projectId/documentos', element: <DocumentosPage /> },
      { path: '/project/:projectId/:disciplina', element: <ProjectPage /> },
      {
        path: '/project/:projectId/:disciplina/resultado/:artefatoId',
        element: <ResultadoPage />,
      },
      {
        // Admin — requer role admin
        element: <PermissionRoute permission="ver_admin" />,
        children: [
          { path: '/admin', element: <AdminPage /> },
          { path: '/membros', element: <MembrosPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
