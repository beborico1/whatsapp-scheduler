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
      alert(t('recipients.invalidPhone'));
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
      alert(err.response?.data?.detail || t('recipients.errorCreateRecipient'));
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
      alert(err.response?.data?.detail || t('recipients.errorCreateGroup'));
    }
  };

  const handleDeleteRecipient = async (id: number) => {
    if (window.confirm(t('recipients.confirmDeleteRecipient'))) {
      try {
        await recipientApi.delete(id);
        setRecipients(recipients.filter(r => r.id !== id));
      } catch (err) {
        console.error('Error deleting recipient:', err);
      }
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (window.confirm(t('recipients.confirmDeleteGroup'))) {
      try {
        await groupApi.delete(id);
        setGroups(groups.filter(g => g.id !== id));
      } catch (err) {
        console.error('Error deleting group:', err);
      }
    }
  };

  if (loading) return <div className="loading">{t('recipients.loading')}</div>;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}><i className="fas fa-address-book"></i> {t('recipients.title')}</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {activeTab === 'recipients' && (
            <button className="btn btn-header-add-recipient" onClick={() => setShowRecipientForm(true)}>
              <i className="fas fa-user-plus"></i> {t('recipients.addRecipient')}
            </button>
          )}
          {activeTab === 'groups' && (
            <button className="btn btn-header-create-group" onClick={() => setShowGroupForm(true)}>
              <i className="fas fa-users-cog"></i> {t('recipients.createGroup')}
            </button>
          )}
        </div>
      </div>
      
      <div className="tab-buttons">
        <button
          className={`tab-button ${activeTab === 'recipients' ? 'active' : ''}`}
          onClick={() => setActiveTab('recipients')}
        >
          <i className="fas fa-user"></i> {t('recipients.recipients')} ({recipients.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          <i className="fas fa-users"></i> {t('recipients.groups')} ({groups.length})
        </button>
      </div>

      {activeTab === 'recipients' && (
        <>
          
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
                  <th>{t('recipients.name')}</th>
                  <th>{t('recipients.phoneNumber')}</th>
                  <th>{t('recipients.groups')}</th>
                  <th>{t('recipients.actions')}</th>
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
                        .join(', ') || t('recipients.none')}
                    </td>
                    <td>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteRecipient(recipient.id)}
                      >
                        <i className="fas fa-trash"></i> {t('recipients.delete')}
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
              <h3>{t('recipients.addRecipient')}</h3>
              <button className="close-btn" onClick={() => setShowRecipientForm(false)}>×</button>
            </div>
            <form onSubmit={handleCreateRecipient}>
              <div className="form-group">
                <label htmlFor="name">{t('recipients.name')}</label>
                <input
                  type="text"
                  id="name"
                  value={newRecipient.name}
                  onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">{t('recipients.phoneNumberWithCode')}</label>
                <input
                  type="text"
                  id="phone"
                  placeholder={t('recipients.phonePlaceholder')}
                  value={newRecipient.phone_number}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setNewRecipient({ ...newRecipient, phone_number: formatted });
                  }}
                  required
                />
                {newRecipient.phone_number && !isValidPhoneNumber(newRecipient.phone_number) && (
                  <small style={{ color: '#e74c3c', marginTop: '0.25rem', display: 'block' }}>
                    {t('recipients.validPhoneError')}
                  </small>
                )}
              </div>
              <div className="form-group">
                <label>{t('recipients.addToGroups')}</label>
                <div className="recipient-list">
                  {groups.length === 0 ? (
                    <div className="empty-state-inline">
                      <div className="empty-state-inline-icon">
                        <i className="fas fa-users"></i>
                      </div>
                      <p>{t('recipients.noGroupsAvailable')}</p>
                      <button
                        type="button"
                        className="btn btn-create-first"
                        onClick={() => {
                          setShowRecipientForm(false);
                          setShowGroupForm(true);
                        }}
                      >
                        <i className="fas fa-plus"></i>
                        {t('recipients.createFirstGroup')}
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
                <button type="submit" className="btn btn-modal-primary">{t('recipients.addRecipient')}</button>
                <button type="button" className="btn btn-modal-cancel" onClick={() => setShowRecipientForm(false)}>
                  {t('recipients.cancel')}
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
              <h3>{t('recipients.createGroup')}</h3>
              <button className="close-btn" onClick={() => setShowGroupForm(false)}>×</button>
            </div>
            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label htmlFor="groupName">{t('recipients.groupName')}</label>
                <input
                  type="text"
                  id="groupName"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">{t('recipients.descriptionOptional')}</label>
                <input
                  type="text"
                  id="description"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>{t('recipients.addRecipients')}</label>
                <div className="recipient-list">
                  {recipients.length === 0 ? (
                    <div className="empty-state-inline">
                      <div className="empty-state-inline-icon">
                        <i className="fas fa-user-plus"></i>
                      </div>
                      <p>{t('recipients.noRecipientsAvailable')}</p>
                      <button
                        type="button"
                        className="btn btn-create-first"
                        onClick={() => {
                          setShowGroupForm(false);
                          setShowRecipientForm(true);
                        }}
                      >
                        <i className="fas fa-plus"></i>
                        {t('recipients.addFirstRecipient')}
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
                <button type="submit" className="btn btn-modal-primary">{t('recipients.createGroup')}</button>
                <button type="button" className="btn btn-modal-cancel" onClick={() => setShowGroupForm(false)}>
                  {t('recipients.cancel')}
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