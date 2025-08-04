import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MessageScheduler from './components/MessageScheduler';
import MessageList from './components/MessageList';
import RecipientManager from './components/RecipientManager';
import ScheduledMessages from './components/ScheduledMessages';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import './App.css';

function AppContent() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="App">
      <nav className="navbar">
        <div>
          <img src="/logo-mini.png" alt="WhatsApp Scheduler Logo" className="navbar-logo" />
          <ul>
            <li><Link to="/">{t('nav.schedule')}</Link></li>
            <li><Link to="/messages">{t('nav.messages')}</Link></li>
            <li><Link to="/recipients">{t('nav.recipients')}</Link></li>
            <li><Link to="/scheduled">{t('nav.scheduled')}</Link></li>
          </ul>
        </div>
        <div className="language-toggle">
          <button
            className={`lang-btn ${language === 'en' ? 'active' : ''}`}
            onClick={() => setLanguage('en')}
          >
            EN
          </button>
          <button
            className={`lang-btn ${language === 'es' ? 'active' : ''}`}
            onClick={() => setLanguage('es')}
          >
            ES
          </button>
        </div>
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
  );
}

function App() {
  return (
    <LanguageProvider>
      <Router>
        <AppContent />
      </Router>
    </LanguageProvider>
  );
}

export default App;
