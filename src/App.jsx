import { useState } from 'react'
import GlassCard from './components/ui/GlassCard'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <GlassCard />
    </>
  )
}

export default App
