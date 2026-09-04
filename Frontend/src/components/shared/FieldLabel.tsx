import { ReactNode } from 'react';

interface FieldLabelProps {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
}

export default function FieldLabel({ children, htmlFor, required }: FieldLabelProps) {
  return (
    <label className="label" htmlFor={htmlFor}>
      {children}
      {required && (
        <span className="text-red-600" aria-hidden="true">
          {' '}
          *
        </span>
      )}
    </label>
  );
}
