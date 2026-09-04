import { Loader2 } from 'lucide-react';

import './Button.css';

function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  onClick,
  disabled = false,
  loading = false,
  icon = null,
  fullWidth = false,
  className = '',
}) {
  return (
    <button
      type={type}
      className={`aurevia-button aurevia-button--${variant} aurevia-button--${size} ${fullWidth ? 'aurevia-button--full' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <Loader2 size={16} className="aurevia-button__spinner" />
      ) : (
        icon && <span className="aurevia-button__icon">{icon}</span>
      )}
      {children}
    </button>
  );
}

export default Button;
