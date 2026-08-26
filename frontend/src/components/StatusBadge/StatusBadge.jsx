import './StatusBadge.css';

function StatusBadge({ status = 'neutral', children }) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      <span className="status-badge__indicator" />
      {children}
    </span>
  );
}

export default StatusBadge;