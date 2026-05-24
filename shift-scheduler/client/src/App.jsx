import { useEffect, useState } from 'react'
import AdminPage from './pages/AdminPage.jsx'
import ViewPage from './pages/ViewPage.jsx'

const normalizeBase = (value) => (value.endsWith('/') ? value : `${value}/`)

const getRelativePath = () => {
  const base = normalizeBase(import.meta.env.BASE_URL || '/')
  const pathname = window.location.pathname || '/'

  if (base !== '/' && pathname.startsWith(base)) {
    const relative = pathname.slice(base.length - 1)
    return relative || '/'
  }

  return pathname
}

const buildUrl = (relativePath) => {
  const base = normalizeBase(import.meta.env.BASE_URL || '/')
  if (relativePath === '/' || relativePath === '') {
    return base
  }
  return `${base.replace(/\/$/, '')}${relativePath}`
}

function App() {
  const [path, setPath] = useState(getRelativePath())

  useEffect(() => {
    const handler = () => setPath(getRelativePath())
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  const navigate = (relativePath) => {
    const url = buildUrl(relativePath)
    window.history.pushState({}, '', url)
    setPath(getRelativePath())
  }

  if (path.startsWith('/admin')) {
    return <AdminPage onNavigateView={() => navigate('/')} />
  }

  return <ViewPage onNavigateAdmin={() => navigate('/admin')} />
}

export default App
