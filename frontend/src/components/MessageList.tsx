import React, { useState, useEffect } from 'react';
import { messageApi, Message } from '../services/api';
import { format } from 'date-fns';

const MessageList: React.FC = () => {
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
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await messageApi.delete(id);
        setMessages(messages.filter(msg => msg.id !== id));
      } catch (err) {
        console.error('Error deleting message:', err);
      }
    }
  };

  if (loading) return <div className="loading">Loading messages...</div>;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Messages</h2>
        <button className="btn" onClick={() => setShowCreateForm(true)}>
          Create New Message
        </button>
      </div>

      {messages.length === 0 ? (
        <p>No messages yet. Create your first message!</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Content Preview</th>
              <th>Created</th>
              <th>Actions</th>
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
                        <button className="btn" onClick={handleUpdate}>Save</button>
                        <button className="btn btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-secondary" onClick={() => handleEdit(message)}>Edit</button>
                        <button className="btn btn-danger" onClick={() => handleDelete(message.id)}>Delete</button>
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
              <h3>Create New Message</h3>
              <button className="close-btn" onClick={() => setShowCreateForm(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
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
                  rows={5}
                />
              </div>
              <div className="actions">
                <button type="submit" className="btn">Create Message</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                  Cancel
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