import './Card.css';

function Card({ children, className = '', hoverable = false, as: Tag = 'section' }) {
  return (
    <Tag className={`aurevia-card ${hoverable ? 'aurevia-card--hoverable' : ''} ${className}`}>
      {children}
    </Tag>
  );
}

export default Card;
