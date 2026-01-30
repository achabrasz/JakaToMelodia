import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { GameRoomPage } from './pages/GameRoomPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/:roomCode" element={<GameRoomPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
