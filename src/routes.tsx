import { createBrowserRouter } from 'react-router'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Projects } from './pages/Projects'
import { Project } from './pages/Project'
import { About } from './pages/About'
import { Contact } from './pages/Contact'
import { NotFound } from './pages/NotFound'

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/projetos', element: <Projects /> },
      { path: '/projetos/:slug', element: <Project /> },
      { path: '/sobre', element: <About /> },
      { path: '/contato', element: <Contact /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
