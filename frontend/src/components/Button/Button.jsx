import './Button.css';

function Button({
  children,
  variant = 'primary',
  type = 'button',
  onClick,
  disabled = false,
}) {
  return (
    <button
      type={type}
      className={`aurevia-button aurevia-button--${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default Button;