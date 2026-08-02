import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Provider } from 'react-redux'
import App from './App.jsx'
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
        containerStyle={{ pointerEvents: 'none' }}
        toastOptions={{
          style: { background: '#0b1220', color: '#d1fae5', border: '1px solid rgba(255,255,255,0.06)', pointerEvents: 'auto' },
        }}
      />
    </Provider>
  </StrictMode>,
)
