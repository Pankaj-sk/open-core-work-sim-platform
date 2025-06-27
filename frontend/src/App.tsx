// @ts-nocheck
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import SimulationPage from './pages/SimulationPage';
import AgentsPage from './pages/AgentsPage';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/simulation" element={<SimulationPage />} />
            <Route path="/agents" element={<AgentsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 