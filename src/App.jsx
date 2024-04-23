import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
// import Map from './components/Map'
import './App.css'
import Iframe from 'react-iframe'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    {/* Title of Site */}
    <div>
      <h1>EasyRoute</h1>
    </div>
    {/* Added iframe for locally hosted map*/}
    <div>
      <iframe
        width="1125px"
        height="625px"
        src="https://ucsc.maps.arcgis.com/apps/instant/3dviewer/index.html?appid=8fe04a1bb50141e081472ca07d8fe1f8"
        style={{ border: 'none', display: 'block' }}></iframe>
    </div>
    </>
  )
}

export default App
