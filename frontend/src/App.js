import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import PutzplanView from './PutzplanView';
import PersonManagement from './PersonManagement';
import TaskManagement from './TaskManagement';
import PrintView from './PrintView';

function App() {
  const handlePrint = () => {
    window.open('/print', '_blank');
  };

  return (
    <Router>
    <div className="App">
        <h1>Putzplan</h1>
        <nav className="main-nav">
          <Link to="/">
            <button>Putzplan</button>
          </Link>
          <Link to="/persons">
            <button>Personen verwalten</button>
          </Link>
          <Link to="/tasks">
            <button>Aufgaben verwalten</button>
          </Link>
          <button onClick={handlePrint}>Druckansicht</button>
        </nav>

        <Routes>
          <Route path="/" element={<PutzplanView />} />
          <Route path="/persons" element={<PersonManagement />} />
          <Route path="/tasks" element={<TaskManagement />} />
          <Route path="/print" element={<PrintView />} />
        </Routes>
    </div>
    </Router>
  );
}

export default App;
