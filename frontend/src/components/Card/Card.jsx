import './Card.css';

function Card({ children, className = '' }) {
  return (
    <section className={`aurevia-card ${className}`}>
      {children}
    </section>
  );
}

export default Card;