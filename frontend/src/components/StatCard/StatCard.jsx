import './StatCard.css';

function StatCard({ icon, label, value, tone = 'primary', trend }) {
  return (
    <div className={`stat-card stat-card--${tone} animate-in`}>
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__body">
        <span className="stat-card__label">{label}</span>
        <span className="stat-card__value">{value}</span>
        {trend && <span className="stat-card__trend">{trend}</span>}
      </div>
    </div>
  );
}

export default StatCard;
