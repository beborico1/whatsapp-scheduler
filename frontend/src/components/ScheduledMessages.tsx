import React, { useState, useEffect } from 'react';
import { scheduleApi, ScheduledMessage } from '../services/api';
import { format } from 'date-fns';
import Select from 'react-select';
import { useLanguage } from '../contexts/LanguageContext';

const ScheduledMessages: React.FC = () => {
  const { t } = useLanguage();
  const [schedules, setSchedules] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    fetchSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await scheduleApi.getAll(filter || undefined);
      setSchedules(response.data);
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (window.confirm(t('scheduled.confirmCancel'))) {
      try {
        await scheduleApi.cancel(id);
        fetchSchedules();
      } catch (err: any) {
        alert(err.response?.data?.detail || t('scheduled.errorCancel'));
      }
    }
  };

  const handleSendNow = async (id: number) => {
    if (window.confirm(t('scheduled.confirmSendNow'))) {
      try {
        await scheduleApi.sendNow(id);
        fetchSchedules();
      } catch (err: any) {
        alert(err.response?.data?.detail || t('scheduled.errorSend'));
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this scheduled message?')) {
      try {
        await scheduleApi.delete(id);
        fetchSchedules();
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Error deleting message');
      }
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'status-badge pending';
      case 'sent': return 'status-badge sent';
      case 'failed': return 'status-badge failed';
      case 'cancelled': return 'status-badge cancelled';
      case 'sending': return 'status-badge pending';
      case 'partially_sent': return 'status-badge pending';
      default: return 'status-badge';
    }
  };

  if (loading) return <div className="loading">{t('scheduled.loading')}</div>;

  return (
    <div className="card">
      <h2>{t('scheduled.title')}</h2>
      
      <div className="form-group">
        <label htmlFor="filter">{t('scheduled.filterByStatus')}</label>
        <Select
          id="filter"
          value={filter ? { value: filter, label: t(`scheduled.status${filter.charAt(0).toUpperCase() + filter.slice(1)}`) } : { value: '', label: t('scheduled.all') }}
          onChange={(option) => setFilter(option?.value || '')}
          options={[
            { value: '', label: t('scheduled.all') },
            { value: 'pending', label: t('scheduled.statusPending') },
            { value: 'sent', label: t('scheduled.statusSent') },
            { value: 'failed', label: t('scheduled.statusFailed') },
            { value: 'cancelled', label: t('scheduled.statusCancelled') }
          ]}
          className="custom-select-container"
          classNamePrefix="custom-select"
        />
      </div>

      {schedules.length === 0 ? (
        <p>{t('scheduled.noScheduled')}</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>{t('scheduled.message')}</th>
              <th>{t('scheduled.group')}</th>
              <th>{t('scheduled.scheduledTime')}</th>
              <th>{t('scheduled.status')}</th>
              <th>{t('scheduled.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((schedule) => (
              <tr key={schedule.id}>
                <td>
                  <strong>{schedule.message.title}</strong>
                  <br />
                  <small>{schedule.message.content.substring(0, 50)}...</small>
                </td>
                <td>
                  {schedule.group.name}
                  <br />
                  <small>{schedule.group.recipients?.length || 0} {t('scheduler.recipients')}</small>
                </td>
                <td>
                  {format(new Date(schedule.scheduled_time), 'MMM d, yyyy h:mm a')}
                  {schedule.sent_at && (
                    <>
                      <br />
                      <small>{t('scheduled.sent')}: {format(new Date(schedule.sent_at), 'MMM d, yyyy h:mm a')}</small>
                    </>
                  )}
                </td>
                <td>
                  <span className={getStatusBadgeClass(schedule.status)}>
                    {t(`scheduled.status${schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}`)}
                  </span>
                  {schedule.error_message && (
                    <>
                      <br />
                      <small style={{ color: 'red' }}>{schedule.error_message}</small>
                    </>
                  )}
                </td>
                <td>
                  <div className="actions">
                    {schedule.status === 'pending' && (
                      <>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleSendNow(schedule.id)}
                        >
                          {t('scheduled.sendNow')}
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleCancel(schedule.id)}
                        >
                          {t('scheduled.cancel')}
                        </button>
                      </>
                    )}
                    {schedule.status === 'failed' && (
                      <button
                        className="btn btn-retry"
                        onClick={() => handleSendNow(schedule.id)}
                      >
                        <i className="fas fa-redo"></i>
                        Retry
                      </button>
                    )}
                    {['cancelled', 'failed'].includes(schedule.status) && (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(schedule.id)}
                      >
                        <i className="fas fa-trash"></i>
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ScheduledMessages;