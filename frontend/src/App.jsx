import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AppHeader from './components/AppHeader';
import Home from './pages/Home';
import History from './pages/History';
import AnalysisDetail from './pages/AnalysisDetail';
import './styles/index.css';

function App() {
  return (
    <div className="app-container">
      <AppHeader />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<History />} />
          <Route path="/analysis/:id" element={<AnalysisDetail />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
