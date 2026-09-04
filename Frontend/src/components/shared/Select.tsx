import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import clsx from 'clsx';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function Select({ value, onChange, options, placeholder = 'Select…', disabled, className }: SelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="input-field flex w-full items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={clsx('truncate', !selected && 'text-gray-400')}>{selected?.label ?? placeholder}</span>
        <ChevronDown className={clsx('h-4 w-4 flex-shrink-0 text-gray-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          {options.length === 0 && <li className="px-3 py-2 text-sm text-gray-400">No options</li>}
          {options.map((option) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={clsx(
                'flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-soft-gray',
                option.value === value ? 'bg-lime/20 font-medium text-charcoal' : 'text-charcoal'
              )}
            >
              <span className="truncate">{option.label}</span>
              {option.value === value && <Check className="h-4 w-4 flex-shrink-0 text-charcoal" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
