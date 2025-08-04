import React, { useState, useEffect } from 'react';
import { scheduleApi, ScheduledMessage } from '../services/api';
import { format } from 'date-fns';

const ScheduledMessages: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    fetchSchedules();
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
    if (window.confirm('Are you sure you want to cancel this scheduled message?')) {
      try {
        await scheduleApi.cancel(id);
        fetchSchedules();
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Error cancelling message');
      }
    }
  };

  const handleSendNow = async (id: number) => {
    if (window.confirm('Are you sure you want to send this message immediately?')) {
      try {
        await scheduleApi.sendNow(id);
        fetchSchedules();
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Error sending message');
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

  if (loading) return <div className="loading">Loading scheduled messages...</div>;

  return (
    <div className="card">
      <h2>Scheduled Messages</h2>
      
      <div className="form-group">
        <label htmlFor="filter">Filter by Status</label>
        <select
          id="filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {schedules.length === 0 ? (
        <p>No scheduled messages found.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Message</th>
              <th>Group</th>
              <th>Scheduled Time</th>
              <th>Status</th>
              <th>Actions</th>
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
                  <small>{schedule.group.recipients?.length || 0} recipients</small>
                </td>
                <td>
                  {format(new Date(schedule.scheduled_time), 'MMM d, yyyy h:mm a')}
                  {schedule.sent_at && (
                    <>
                      <br />
                      <small>Sent: {format(new Date(schedule.sent_at), 'MMM d, yyyy h:mm a')}</small>
                    </>
                  )}
                </td>
                <td>
                  <span className={getStatusBadgeClass(schedule.status)}>
                    {schedule.status}
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
                          Send Now
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleCancel(schedule.id)}
                        >
                          Cancel
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