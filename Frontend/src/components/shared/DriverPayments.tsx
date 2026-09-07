import { useEffect, useState } from 'react';
import { PaymentService } from '@/services/paymentService';
import { Payment, PaymentMethod } from '@/types/payment';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate } from '@/utils/formatters';
import FieldLabel from './FieldLabel';
import Select from './Select';

interface DriverPaymentsProps {
  driverId: string;
  totalEarnings: number;
  totalPaid: number;
  onPaid?: (newTotalPaid: number) => void;
}

const methodOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'mpesa', label: 'M-Pesa' },
];

export default function DriverPayments({ driverId, totalEarnings, totalPaid, onPaid }: DriverPaymentsProps) {
  const { role } = useAuth();
  const canRecord = role === 'manager' || role === 'admin';
  const [payments, setPayments] = useState<Payment[]>([]);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const push = useNotificationStore((s) => s.push);

  const load = () => {
    PaymentService.list(driverId).then((res) => setPayments(res.data?.payments ?? []));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId]);

  const balance = totalEarnings - totalPaid;

  const handleRecord = async () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      push('Enter a valid payment amount.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const response = await PaymentService.record(driverId, value, method, note || undefined);
      push(response.success ? 'Payment recorded.' : response.message, response.success ? 'success' : 'error');
      if (response.success) {
        setAmount('');
        setNote('');
        load();
        if (response.data?.totalPaid !== undefined) onPaid?.(response.data.totalPaid);
      }
    } catch (error: any) {
      push(error?.response?.data?.message || 'Failed to record payment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Earned</p>
          <p className="font-semibold text-charcoal">{formatCurrency(totalEarnings)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Paid</p>
          <p className="font-semibold text-charcoal">{formatCurrency(totalPaid)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Balance Owed</p>
          <p className={`font-semibold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(Math.max(balance, 0))}
          </p>
        </div>
      </div>

      {canRecord && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg bg-soft-gray p-3">
          <div className="w-28">
            <FieldLabel>Amount (KSh)</FieldLabel>
            <input
              type="number"
              className="input-field"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="w-32">
            <FieldLabel>Method</FieldLabel>
            <Select value={method} onChange={(v) => setMethod(v as PaymentMethod)} options={methodOptions} />
          </div>
          <div className="min-w-[140px] flex-1">
            <FieldLabel>Note (optional)</FieldLabel>
            <input
              className="input-field"
              placeholder="e.g. Week ending Sept 6"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={handleRecord} disabled={submitting}>
            {submitting ? 'Recording…' : 'Record Payment'}
          </button>
        </div>
      )}

      {payments.length > 0 && (
        <ul className="flex max-h-40 flex-col gap-2 overflow-y-auto">
          {payments.map((p) => (
            <li key={p._id} className="flex items-center justify-between text-sm">
              <span className="text-charcoal">
                {formatCurrency(p.amount)} · {p.method === 'mpesa' ? 'M-Pesa' : 'Cash'}
                {p.note ? ` - ${p.note}` : ''}
              </span>
              <span className="text-xs text-gray-400">
                {formatDate(p.createdAt)}
                {p.recordedByName ? ` by ${p.recordedByName}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
