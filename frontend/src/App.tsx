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
          <h1>WhatsApp Scheduler</h1>
          <ul>
            <li><Link to="/">Schedule Message</Link></li>
            <li><Link to="/messages">Messages</Link></li>
            <li><Link to="/recipients">Recipients</Link></li>
            <li><Link to="/scheduled">Scheduled</Link></li>
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
