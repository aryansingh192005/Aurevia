import './Spinner.css';

function Spinner({ label = 'Loading...', size = 'md', fullPage = false }) {
  return (
    <div className={`spinner-wrap ${fullPage ? 'spinner-wrap--full' : ''}`}>
      <div className={`spinner spinner--${size}`} />
      {label && <p className="spinner-label">{label}</p>}
    </div>
  );
}

export default Spinner;
