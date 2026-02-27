import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import router from './routes/router'
import store from './store/slices/store.js'
ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <provider store={store}>
      <RouterProvider router={router} />
    </provider>
  </StrictMode>,
)
