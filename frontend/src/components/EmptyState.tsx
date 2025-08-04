import React from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <i className={icon}></i>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && (
        <button className="btn" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;