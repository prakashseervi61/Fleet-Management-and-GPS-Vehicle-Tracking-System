import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { UIProvider } from './context/UIContext'
import AppRouter from './routes/AppRouter'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <UIProvider>
            <AppRouter />
          </UIProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
