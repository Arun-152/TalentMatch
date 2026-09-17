import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AppHeader from './components/AppHeader';
import Home from './pages/Home';
import AnalysisDetail from './pages/AnalysisDetail';
import './styles/index.css';

/**
 * App — root router.
 * History route removed; the app is a focused single-flow tool:
 *   / → upload form
 *   /analysis/:id → results page
 */
function App() {
  return (
    <div className="app-container">
      <AppHeader />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analysis/:id" element={<AnalysisDetail />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
