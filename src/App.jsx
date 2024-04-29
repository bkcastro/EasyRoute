import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Map from './components/Map'
import MapTest from './components/MapTest'
import './App.css'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      {/* Title of Site */}
      <div>
        <h1>EasyRoute</h1>
      </div>
      {/* Added iframe for locally hosted map*/}
      <MapTest />
    </>
  )
}

export default App
