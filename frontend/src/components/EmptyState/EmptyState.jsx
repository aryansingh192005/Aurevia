import './EmptyState.css';

function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state animate-in">
      {icon && <div className="empty-state__icon">{icon}</div>}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}

export default EmptyState;
