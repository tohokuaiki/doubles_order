import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import FakeLoading from './components/Loading/FakeLoading'
import FakeLoadingProvider from './components/Context/FakeLoadingContextProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FakeLoadingProvider>
      <FakeLoading />
      <App />
    </FakeLoadingProvider>
  </StrictMode>,
)
