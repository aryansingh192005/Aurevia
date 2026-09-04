import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

import './Alert.css';

const ICONS = {
  error: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};

function Alert({ variant = 'info', children }) {
  const Icon = ICONS[variant] || Info;

  return (
    <div className={`alert alert--${variant}`} role={variant === 'error' ? 'alert' : 'status'}>
      <Icon size={18} />
      <span>{children}</span>
    </div>
  );
}

export default Alert;
