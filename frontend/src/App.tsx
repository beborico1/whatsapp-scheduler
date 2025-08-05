import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MessageScheduler from './components/MessageScheduler';
import MessageList from './components/MessageList';
import RecipientManager from './components/RecipientManager';
import ScheduledMessages from './components/ScheduledMessages';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import './App.css';

function AppContent() {
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="App">
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            <img src="/logo-mini.png" alt="WhatsApp Scheduler Logo" className="navbar-logo" />
            <span className="navbar-title">WhatsApp Scheduler</span>
          </div>
          <div className="language-toggle">
            <button className={`lang-btn ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>EN</button><button className={`lang-btn ${language === 'es' ? 'active' : ''}`} onClick={() => setLanguage('es')}>ES</button>
          </div>
          <button 
            className="mobile-menu-toggle" 
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
        <ul className={mobileMenuOpen ? 'mobile-menu-open' : ''}>
          <li><Link to="/" onClick={closeMobileMenu}>{t('nav.schedule')}</Link></li>
          <li><Link to="/messages" onClick={closeMobileMenu}>{t('nav.messages')}</Link></li>
          <li><Link to="/recipients" onClick={closeMobileMenu}>{t('nav.recipients')}</Link></li>
          <li><Link to="/scheduled" onClick={closeMobileMenu}>{t('nav.scheduled')}</Link></li>
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
