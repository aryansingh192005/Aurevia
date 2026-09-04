import './FormField.css';

function FormField({ label, htmlFor, children, hint }) {
  return (
    <div className="form-field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <span className="form-field__hint">{hint}</span>}
    </div>
  );
}

export default FormField;
