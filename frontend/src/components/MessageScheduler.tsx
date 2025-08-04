import React, { useState, useEffect } from 'react';
import { messageApi, groupApi, scheduleApi, Message, RecipientGroup } from '../services/api';
import { format } from 'date-fns';

const MessageScheduler: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [groups, setGroups] = useState<RecipientGroup[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<number | ''>('');
  const [selectedGroup, setSelectedGroup] = useState<number | ''>('');
  const [scheduledTime, setScheduledTime] = useState('');
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
      setError('Failed to create message');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedMessage || !selectedGroup || !scheduledTime) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await scheduleApi.create({
        message_id: Number(selectedMessage),
        group_id: Number(selectedGroup),
        scheduled_time: new Date(scheduledTime).toISOString(),
      });
      
      setSuccess('Message scheduled successfully!');
      setSelectedMessage('');
      setSelectedGroup('');
      setScheduledTime('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to schedule message');
    } finally {
      setLoading(false);
    }
  };

  const minDateTime = format(new Date(), "yyyy-MM-dd'T'HH:mm");

  return (
    <>
      <div className="welcome-section">
        <img src="/logo.png" alt="WhatsApp Scheduler" className="welcome-logo" />
        <p className="welcome-text">Schedule your WhatsApp messages with ease</p>
      </div>
      
      <div className="card">
        <h2>Schedule a WhatsApp Message</h2>
        
        {error && <div className="message error">{error}</div>}
        {success && <div className="message success">{success}</div>}

      <form onSubmit={handleSchedule}>
        <div className="form-group">
          <label htmlFor="message">Message</label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select
              id="message"
              value={selectedMessage}
              onChange={(e) => setSelectedMessage(e.target.value ? Number(e.target.value) : '')}
              required
              style={{ flex: 1 }}
            >
              <option value="">Select a message</option>
              {messages.map((msg) => (
                <option key={msg.id} value={msg.id}>
                  {msg.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowMessageForm(true)}
            >
              New Message
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="group">Recipient Group</label>
          <select
            id="group"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value ? Number(e.target.value) : '')}
            required
          >
            <option value="">Select a group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} ({group.recipients?.length || 0} recipients)
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="scheduledTime">Schedule Date & Time</label>
          <input
            type="datetime-local"
            id="scheduledTime"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            min={minDateTime}
            required
          />
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Scheduling...' : 'Schedule Message'}
        </button>
      </form>

      {showMessageForm && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Message</h3>
              <button
                className="close-btn"
                onClick={() => setShowMessageForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateMessage}>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  value={newMessage.title}
                  onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="content">Content</label>
                <textarea
                  id="content"
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  required
                />
              </div>
              <div className="actions">
                <button type="submit" className="btn" disabled={loading}>
                  Create Message
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowMessageForm(false)}
                >
                  Cancel
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