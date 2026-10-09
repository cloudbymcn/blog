import { createBrowserRouter } from 'react-router'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'

// só a home vai no bundle principal; as outras rotas viram chunks carregados na navegação
export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/projetos', lazy: async () => ({ Component: (await import('./pages/Projects')).Projects }) },
      {
        path: '/projetos/:slug',
        lazy: async () => ({ Component: (await import('./pages/Project')).Project }),
      },
      { path: '/sobre', lazy: async () => ({ Component: (await import('./pages/About')).About }) },
      { path: '/contato', lazy: async () => ({ Component: (await import('./pages/Contact')).Contact }) },
      { path: '*', lazy: async () => ({ Component: (await import('./pages/NotFound')).NotFound }) },
    ],
  },
])
