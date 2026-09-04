interface DetailFieldProps {
  label: string;
  value?: string | number | null;
}

export default function DetailField({ label, value }: DetailFieldProps) {
  const display = value === 0 ? '0' : value || '—';
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-sm text-charcoal">{display}</p>
    </div>
  );
}
