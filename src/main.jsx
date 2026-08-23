import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Provider } from 'react-redux'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import router from './routes/router'
import store from './store/store.js'
import Loader from './components/ui/Loader.jsx'
import { Toaster } from 'react-hot-toast'

// Apply initial theme before React mounts for flicker-free load
try {
  const stored = localStorage.getItem('shopindia_theme');
  if (stored === 'dark') document.documentElement.classList.add('dark');
  else if (stored === 'light') document.documentElement.classList.remove('dark');
} catch (e) {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} 
        fallbackElement={<Loader />}
      />
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'premium-toast',
          duration: 3500,
          style: {
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '1rem',
            padding: '12px 18px',
            fontSize: '13px',
            fontWeight: '600',
            boxShadow: '0 20px 35px -5px rgba(0, 0, 0, 0.4), 0 10px 15px -5px rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(16px)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
            style: {
              border: '1px solid rgba(16, 185, 129, 0.35)',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
            style: {
              border: '1px solid rgba(239, 68, 68, 0.35)',
            },
          },
        }}
      />
    </Provider>
  </StrictMode>,
)
