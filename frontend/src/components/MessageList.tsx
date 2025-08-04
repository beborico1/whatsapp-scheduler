import React, { useState, useEffect } from 'react';
import { messageApi, Message } from '../services/api';
import { format } from 'date-fns';
import { useLanguage } from '../contexts/LanguageContext';

const MessageList: React.FC = () => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMessage, setNewMessage] = useState({ title: '', content: '' });

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await messageApi.getAll();
      setMessages(response.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await messageApi.create(newMessage);
      setMessages([response.data, ...messages]);
      setNewMessage({ title: '', content: '' });
      setShowCreateForm(false);
    } catch (err) {
      console.error('Error creating message:', err);
    }
  };

  const handleEdit = (message: Message) => {
    setEditingId(message.id);
    setEditForm({ title: message.title, content: message.content });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      const response = await messageApi.update(editingId, editForm);
      setMessages(messages.map(msg => msg.id === editingId ? response.data : msg));
      setEditingId(null);
    } catch (err) {
      console.error('Error updating message:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('messages.confirmDelete'))) {
      try {
        await messageApi.delete(id);
        setMessages(messages.filter(msg => msg.id !== id));
      } catch (err) {
        console.error('Error deleting message:', err);
      }
    }
  };

  if (loading) return <div className="loading">{t('messages.loading')}</div>;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>{t('messages.title')}</h2>
        <button className="btn btn-create-message" onClick={() => setShowCreateForm(true)}>
          <i className="fas fa-plus"></i>
          {t('messages.createNewMessage')}
        </button>
      </div>

      {messages.length === 0 ? (
        <p>{t('messages.noMessages')}</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>{t('messages.messageTitle')}</th>
              <th>{t('messages.contentPreview')}</th>
              <th>{t('messages.created')}</th>
              <th>{t('messages.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((message) => (
              <tr key={message.id}>
                <td>
                  {editingId === message.id ? (
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="table-edit-input"
                      placeholder={t('messages.enterTitle')}
                      autoFocus
                    />
                  ) : (
                    message.title
                  )}
                </td>
                <td>
                  {editingId === message.id ? (
                    <textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      rows={3}
                      className="table-edit-textarea"
                      placeholder={t('messages.enterContent')}
                    />
                  ) : (
                    message.content.substring(0, 100) + (message.content.length > 100 ? '...' : '')
                  )}
                </td>
                <td>{format(new Date(message.created_at), 'MMM d, yyyy')}</td>
                <td>
                  <div className="actions">
                    {editingId === message.id ? (
                      <>
                        <button className="btn btn-save-edit" onClick={handleUpdate}>
                          <i className="fas fa-check"></i>
                          {t('messages.save')}
                        </button>
                        <button className="btn btn-cancel-edit" onClick={() => setEditingId(null)}>
                          <i className="fas fa-times"></i>
                          {t('messages.cancel')}
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-edit" onClick={() => handleEdit(message)}>
                          <i className="fas fa-edit"></i>
                          {t('messages.edit')}
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDelete(message.id)}>
                          <i className="fas fa-trash"></i>
                          {t('messages.delete')}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showCreateForm && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{t('messages.createNewMessage')}</h3>
              <button className="close-btn" onClick={() => setShowCreateForm(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label htmlFor="title">{t('messages.messageTitle')}</label>
                <input
                  type="text"
                  id="title"
                  value={newMessage.title}
                  onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="content">{t('messages.content')}</label>
                <textarea
                  id="content"
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  required
                  rows={5}
                />
              </div>
              <div className="actions">
                <button type="submit" className="btn">{t('messages.create')}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                  {t('messages.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;