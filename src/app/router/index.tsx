import { createBrowserRouter, Navigate } from 'react-router-dom'
import { DashboardPage } from '@/pages/dashboard/ui/DashboardPage'
import { ProjectPage } from '@/pages/project/ui/ProjectPage'
import { ResultadoPage } from '@/pages/resultado/ui/ResultadoPage'
import { AdminPage } from '@/pages/admin/ui/AdminPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardPage />,
  },
  {
    path: '/project/:projectId',
    element: <ProjectPage />,
  },
  {
    path: '/project/:projectId/:disciplina',
    element: <ProjectPage />,
  },
  {
    path: '/project/:projectId/:disciplina/resultado/:insumoId',
    element: <ResultadoPage />,
  },
  {
    path: '/admin',
    element: <AdminPage />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
