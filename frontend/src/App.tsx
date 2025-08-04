import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MessageScheduler from './components/MessageScheduler';
import MessageList from './components/MessageList';
import RecipientManager from './components/RecipientManager';
import ScheduledMessages from './components/ScheduledMessages';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <img src="/logo-mini.png" alt="WhatsApp Scheduler Logo" className="navbar-logo" />
          <ul>
            <li><Link to="/"><i className="fas fa-clock"></i> Schedule Message</Link></li>
            <li><Link to="/messages"><i className="fas fa-comment-dots"></i> Messages</Link></li>
            <li><Link to="/recipients"><i className="fas fa-users"></i> Recipients</Link></li>
            <li><Link to="/scheduled"><i className="fas fa-calendar-check"></i> Scheduled</Link></li>
          </ul>
        </nav>
        
        <main className="container">
          <Routes>
            <Route path="/" element={<MessageScheduler />} />
            <Route path="/messages" element={<MessageList />} />
            <Route path="/recipients" element={<RecipientManager />} />
            <Route path="/scheduled" element={<ScheduledMessages />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
