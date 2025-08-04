import React, { useState, useEffect } from 'react';
import { messageApi, groupApi, scheduleApi, Message, RecipientGroup } from '../services/api';
import Select from 'react-select';
import DatePicker from 'react-datepicker';

const MessageScheduler: React.FC = () => {
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
        scheduled_time: scheduledTime!.toISOString(),
      });
      
      setSuccess('Message scheduled successfully!');
      setSelectedMessage('');
      setSelectedGroup('');
      setScheduledTime(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to schedule message');
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
        <h2>Schedule a WhatsApp Message</h2>
        
        {error && <div className="message error">{error}</div>}
        {success && <div className="message success">{success}</div>}

      <form onSubmit={handleSchedule}>
        <div className="form-group">
          <label htmlFor="message">Message</label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Select
              id="message"
              value={messages.find(msg => msg.id === selectedMessage) ? { value: selectedMessage, label: messages.find(msg => msg.id === selectedMessage)!.title } : null}
              onChange={(option) => setSelectedMessage(option ? option.value : '')}
              options={messages.map(msg => ({ value: msg.id, label: msg.title }))}
              placeholder="Select a message"
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
              New Message
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="group">Recipient Group</label>
          <Select
            id="group"
            value={groups.find(grp => grp.id === selectedGroup) ? { value: selectedGroup, label: `${groups.find(grp => grp.id === selectedGroup)!.name} (${groups.find(grp => grp.id === selectedGroup)!.recipients?.length || 0} recipients)` } : null}
            onChange={(option) => setSelectedGroup(option ? option.value : '')}
            options={groups.map(group => ({ 
              value: group.id, 
              label: `${group.name} (${group.recipients?.length || 0} recipients)` 
            }))}
            placeholder="Select a group"
            className="custom-select-container"
            classNamePrefix="custom-select"
          />
        </div>

        <div className="form-group">
          <label htmlFor="scheduledTime">Schedule Date & Time</label>
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
              placeholderText="Select date and time"
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
              Scheduling...
            </>
          ) : (
            <>
              <i className="fas fa-clock"></i>
              Schedule Message
            </>
          )}
        </button>
      </form>
    </div>

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
                <button type="submit" className="btn btn-modal-create" disabled={loading}>
                  Create Message
                </button>
                <button
                  type="button"
                  className="btn btn-modal-cancel"
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