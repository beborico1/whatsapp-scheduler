import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { recipientApi, groupApi, Recipient, RecipientGroup } from '../services/api';
import EmptyState from './EmptyState';
import { formatPhoneNumber, isValidPhoneNumber, normalizePhoneNumber } from '../utils/phoneFormatter';
import { useLanguage } from '../contexts/LanguageContext';

const RecipientManager: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [groups, setGroups] = useState<RecipientGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recipients' | 'groups'>('recipients');
  
  const [showRecipientForm, setShowRecipientForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  
  const [newRecipient, setNewRecipient] = useState({
    name: '',
    phone_number: '',
    group_ids: [] as number[]
  });
  
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    recipient_ids: [] as number[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Handle URL parameters
    const tab = searchParams.get('tab');
    const action = searchParams.get('action');
    
    if (tab === 'groups') {
      setActiveTab('groups');
    }
    
    if (action === 'create' && tab === 'groups') {
      setShowGroupForm(true);
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recipientsRes, groupsRes] = await Promise.all([
        recipientApi.getAll(),
        groupApi.getAll()
      ]);
      setRecipients(recipientsRes.data);
      setGroups(groupsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number
    if (!isValidPhoneNumber(newRecipient.phone_number)) {
      alert('Please enter a valid phone number with country code (e.g., +1234567890)');
      return;
    }
    
    try {
      // Normalize phone number before sending
      const normalizedRecipient = {
        ...newRecipient,
        phone_number: normalizePhoneNumber(newRecipient.phone_number)
      };
      
      const response = await recipientApi.create(normalizedRecipient);
      setRecipients([...recipients, response.data]);
      setNewRecipient({ name: '', phone_number: '', group_ids: [] });
      setShowRecipientForm(false);
      fetchData(); // Refresh to get updated group memberships
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error creating recipient');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await groupApi.create(newGroup);
      setGroups([...groups, response.data]);
      setNewGroup({ name: '', description: '', recipient_ids: [] });
      setShowGroupForm(false);
      fetchData(); // Refresh to get updated memberships
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error creating group');
    }
  };

  const handleDeleteRecipient = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this recipient?')) {
      try {
        await recipientApi.delete(id);
        setRecipients(recipients.filter(r => r.id !== id));
      } catch (err) {
        console.error('Error deleting recipient:', err);
      }
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      try {
        await groupApi.delete(id);
        setGroups(groups.filter(g => g.id !== id));
      } catch (err) {
        console.error('Error deleting group:', err);
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="card">
      <h2><i className="fas fa-address-book"></i> Recipients & Groups</h2>
      
      <div className="tab-buttons">
        <button
          className={`tab-button ${activeTab === 'recipients' ? 'active' : ''}`}
          onClick={() => setActiveTab('recipients')}
        >
          <i className="fas fa-user"></i> Recipients ({recipients.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          <i className="fas fa-users"></i> Groups ({groups.length})
        </button>
      </div>

      {activeTab === 'recipients' && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <button className="btn btn-add-recipient" onClick={() => setShowRecipientForm(true)}>
              <i className="fas fa-user-plus"></i> Add Recipient
            </button>
          </div>
          
          {recipients.length === 0 ? (
            <EmptyState
              icon="fas fa-user-friends"
              title="No recipients yet"
              description="Add your first recipient to start sending WhatsApp messages"
              action={{
                label: 'Add First Recipient',
                onClick: () => setShowRecipientForm(true)
              }}
            />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone Number</th>
                  <th>Groups</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((recipient) => (
                  <tr key={recipient.id}>
                    <td>{recipient.name}</td>
                    <td>{formatPhoneNumber(recipient.phone_number)}</td>
                    <td>
                      {groups
                        .filter(g => g.recipients?.some(r => r.id === recipient.id))
                        .map(g => g.name)
                        .join(', ') || 'None'}
                    </td>
                    <td>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteRecipient(recipient.id)}
                      >
                        <i className="fas fa-trash"></i> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {activeTab === 'groups' && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <button className="btn btn-create-group" onClick={() => setShowGroupForm(true)}>
              <i className="fas fa-users-cog"></i> Create Group
            </button>
          </div>
          
          {groups.length === 0 ? (
            <EmptyState
              icon="fas fa-users"
              title="No groups yet"
              description="Create groups to organize your recipients and send bulk messages"
              action={{
                label: 'Create First Group',
                onClick: () => setShowGroupForm(true)
              }}
            />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Recipients</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.id}>
                    <td>{group.name}</td>
                    <td>{group.description || '-'}</td>
                    <td>{group.recipients?.length || 0}</td>
                    <td>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteGroup(group.id)}
                      >
                        <i className="fas fa-trash"></i> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {showRecipientForm && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Recipient</h3>
              <button className="close-btn" onClick={() => setShowRecipientForm(false)}>×</button>
            </div>
            <form onSubmit={handleCreateRecipient}>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  value={newRecipient.name}
                  onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number (with country code)</label>
                <input
                  type="text"
                  id="phone"
                  placeholder="+1 (234) 567-8900"
                  value={newRecipient.phone_number}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setNewRecipient({ ...newRecipient, phone_number: formatted });
                  }}
                  required
                />
                {newRecipient.phone_number && !isValidPhoneNumber(newRecipient.phone_number) && (
                  <small style={{ color: '#e74c3c', marginTop: '0.25rem', display: 'block' }}>
                    Please enter a valid phone number with country code
                  </small>
                )}
              </div>
              <div className="form-group">
                <label>Add to Groups</label>
                <div className="recipient-list">
                  {groups.length === 0 ? (
                    <div className="empty-state-inline">
                      <div className="empty-state-inline-icon">
                        <i className="fas fa-users"></i>
                      </div>
                      <p>No groups available yet</p>
                      <button
                        type="button"
                        className="btn btn-create-first"
                        onClick={() => {
                          setShowRecipientForm(false);
                          setShowGroupForm(true);
                        }}
                      >
                        <i className="fas fa-plus"></i>
                        Create First Group
                      </button>
                    </div>
                  ) : (
                    groups.map((group) => (
                      <label key={group.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newRecipient.group_ids.includes(group.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewRecipient({
                                ...newRecipient,
                                group_ids: [...newRecipient.group_ids, group.id]
                              });
                            } else {
                              setNewRecipient({
                                ...newRecipient,
                                group_ids: newRecipient.group_ids.filter(id => id !== group.id)
                              });
                            }
                          }}
                        />
                        {group.name}
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="actions">
                <button type="submit" className="btn btn-modal-primary">Add Recipient</button>
                <button type="button" className="btn btn-modal-cancel" onClick={() => setShowRecipientForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGroupForm && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Group</h3>
              <button className="close-btn" onClick={() => setShowGroupForm(false)}>×</button>
            </div>
            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label htmlFor="groupName">Group Name</label>
                <input
                  type="text"
                  id="groupName"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description (optional)</label>
                <input
                  type="text"
                  id="description"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Add Recipients</label>
                <div className="recipient-list">
                  {recipients.length === 0 ? (
                    <div className="empty-state-inline">
                      <div className="empty-state-inline-icon">
                        <i className="fas fa-user-plus"></i>
                      </div>
                      <p>No recipients available yet</p>
                      <button
                        type="button"
                        className="btn btn-create-first"
                        onClick={() => {
                          setShowGroupForm(false);
                          setShowRecipientForm(true);
                        }}
                      >
                        <i className="fas fa-plus"></i>
                        Add First Recipient
                      </button>
                    </div>
                  ) : (
                    recipients.map((recipient) => (
                      <label key={recipient.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newGroup.recipient_ids.includes(recipient.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewGroup({
                                ...newGroup,
                                recipient_ids: [...newGroup.recipient_ids, recipient.id]
                              });
                            } else {
                              setNewGroup({
                                ...newGroup,
                                recipient_ids: newGroup.recipient_ids.filter(id => id !== recipient.id)
                              });
                            }
                          }}
                        />
                        {recipient.name} ({formatPhoneNumber(recipient.phone_number)})
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="actions">
                <button type="submit" className="btn btn-modal-primary">Create Group</button>
                <button type="button" className="btn btn-modal-cancel" onClick={() => setShowGroupForm(false)}>
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

export default RecipientManager;