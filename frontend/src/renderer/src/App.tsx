import { useEffect, useState } from 'react'
import { AuthPage } from './components/auth/AuthPage'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { WelcomePage } from './components/welcome/WelcomePage'
import { useAuthSession } from './states/auth/sessionState'

function App(): React.JSX.Element {
  const [route, setRoute] = useState(() => window.location.hash.slice(2))
  const session = useAuthSession((state) => state.session)

  useEffect(() => {
    const syncRoute = (): void => setRoute(window.location.hash.slice(2))
    window.addEventListener('hashchange', syncRoute)
    return () => window.removeEventListener('hashchange', syncRoute)
  }, [])

  useEffect(() => {
    if ((route === 'dashboard' || route === 'profile') && !session) window.location.hash = '/login'
  }, [route, session])

  if (route === 'login' || route === 'register') {
    return <AuthPage mode={route} />
  }
  if (route === 'dashboard' || route === 'profile') {
    return session ? <DashboardPage initialProfileOpen={route === 'profile'} /> : <AuthPage mode="login" />
  }

  return <WelcomePage />
}

export default App
