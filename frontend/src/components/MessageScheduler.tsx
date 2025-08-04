import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { messageApi, groupApi, scheduleApi, Message, RecipientGroup } from '../services/api';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import { useLanguage } from '../contexts/LanguageContext';

const MessageScheduler: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [groups, setGroups] = useState<RecipientGroup[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<number | ''>('');
  const [selectedGroup, setSelectedGroup] = useState<number | ''>('');
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [newMessage, setNewMessage] = useState({ title: '', content: '' });

  useEffect(() => {
    fetchMessages();
    fetchGroups();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await messageApi.getAll();
      setMessages(response.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await groupApi.getAll();
      setGroups(response.data);
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  };

  const handleCreateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.title || !newMessage.content) return;

    try {
      setLoading(true);
      const response = await messageApi.create(newMessage);
      setMessages([...messages, response.data]);
      setSelectedMessage(response.data.id);
      setNewMessage({ title: '', content: '' });
      setShowMessageForm(false);
    } catch (err) {
      setError(t('scheduler.errorCreate'));
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedMessage || !selectedGroup || !scheduledTime) {
      setError(t('scheduler.errorFillFields'));
      return;
    }

    try {
      setLoading(true);
      await scheduleApi.create({
        message_id: Number(selectedMessage),
        group_id: Number(selectedGroup),
        scheduled_time: scheduledTime!.toISOString(),
      });
      
      setSuccess(t('scheduler.successMessage'));
      setSelectedMessage('');
      setSelectedGroup('');
      setScheduledTime(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || t('scheduler.errorSchedule'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* <div className="welcome-section">
        <img src="/logo.png" alt="WhatsApp Scheduler" className="welcome-logo" />
        <p className="welcome-text">Schedule your WhatsApp messages with ease</p>
      </div> */}
      
      <div className="card">
        <h2>{t('scheduler.title')}</h2>
        
        {error && <div className="message error">{error}</div>}
        {success && <div className="message success">{success}</div>}

      <form onSubmit={handleSchedule}>
        <div className="form-group">
          <label htmlFor="message">{t('scheduler.message')}</label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Select
              id="message"
              value={messages.find(msg => msg.id === selectedMessage) ? { value: selectedMessage, label: messages.find(msg => msg.id === selectedMessage)!.title } : null}
              onChange={(option) => setSelectedMessage(option ? option.value : '')}
              options={messages.map(msg => ({ value: msg.id, label: msg.title }))}
              placeholder={t('scheduler.selectMessage')}
              className="custom-select-container"
              classNamePrefix="custom-select"
              styles={{ container: (provided) => ({ ...provided, flex: 1 }) }}
            />
            <button
              type="button"
              className="btn btn-new-message"
              onClick={() => setShowMessageForm(true)}
            >
              <i className="fas fa-plus"></i>
              {t('scheduler.newMessage')}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="group">{t('scheduler.recipientGroup')}</label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Select
              id="group"
              value={groups.find(grp => grp.id === selectedGroup) ? { value: selectedGroup, label: `${groups.find(grp => grp.id === selectedGroup)!.name} (${groups.find(grp => grp.id === selectedGroup)!.recipients?.length || 0} ${t('scheduler.recipients')})` } : null}
              onChange={(option) => setSelectedGroup(option ? option.value : '')}
              options={groups.map(group => ({ 
                value: group.id, 
                label: `${group.name} (${group.recipients?.length || 0} ${t('scheduler.recipients')})` 
              }))}
              placeholder={t('scheduler.selectGroup')}
              className="custom-select-container"
              classNamePrefix="custom-select"
              styles={{ container: (provided) => ({ ...provided, flex: 1 }) }}
            />
            <button
              type="button"
              className="btn btn-new-group"
              onClick={() => navigate('/recipients?tab=groups&action=create')}
            >
              <i className="fas fa-users"></i>
              {t('scheduler.newGroup')}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="scheduledTime">{t('scheduler.scheduleDateTime')}</label>
          <div className="custom-datepicker">
            <DatePicker
              selected={scheduledTime}
              onChange={(date) => setScheduledTime(date)}
              onCalendarOpen={() => {
                if (!scheduledTime) {
                  setScheduledTime(new Date());
                }
              }}
              showTimeInput
              dateFormat="MMM d, yyyy HH:mm:ss"
              minDate={new Date()}
              placeholderText={t('scheduler.selectDateTime')}
              required
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              timeCaption="Time"
              timeInputLabel="Time:"
            />
          </div>
        </div>

        <button type="submit" className="btn btn-schedule" disabled={loading}>
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              {t('scheduler.scheduling')}
            </>
          ) : (
            <>
              <i className="fas fa-clock"></i>
              {t('scheduler.scheduleButton')}
            </>
          )}
        </button>
      </form>
    </div>

      {showMessageForm && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{t('scheduler.createNewMessage')}</h3>
              <button
                className="close-btn"
                onClick={() => setShowMessageForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateMessage}>
              <div className="form-group">
                <label htmlFor="title">{t('scheduler.messageTitle')}</label>
                <input
                  type="text"
                  id="title"
                  value={newMessage.title}
                  onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="content">{t('scheduler.content')}</label>
                <textarea
                  id="content"
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  required
                />
              </div>
              <div className="actions">
                <button type="submit" className="btn btn-modal-create" disabled={loading}>
                  {t('scheduler.createMessage')}
                </button>
                <button
                  type="button"
                  className="btn btn-modal-cancel"
                  onClick={() => setShowMessageForm(false)}
                >
                  {t('scheduler.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default MessageScheduler;