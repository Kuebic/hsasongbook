import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SearchPage } from './features/song-search'
import { SongViewPage } from './features/song-display'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/song/:id" element={<SongViewPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
