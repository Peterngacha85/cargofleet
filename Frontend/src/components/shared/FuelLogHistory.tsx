import { useEffect, useState } from 'react';
import { FuelLogService } from '@/services/fuelLogService';
import { FuelLog, FuelLogTotals } from '@/types/fuelLog';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface FuelLogHistoryProps {
  vehicleId: string;
}

export default function FuelLogHistory({ vehicleId }: FuelLogHistoryProps) {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [totals, setTotals] = useState<FuelLogTotals | null>(null);

  useEffect(() => {
    FuelLogService.list({ vehicleId }).then((res) => {
      setFuelLogs(res.data?.fuelLogs ?? []);
      setTotals(res.data?.totals ?? null);
    });
  }, [vehicleId]);

  if (fuelLogs.length === 0) {
    return <p className="text-sm text-gray-400">No fuel logged yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {totals && (
        <p className="text-sm text-gray-500">
          Total: {totals.liters.toFixed(1)} L · {formatCurrency(totals.cost)}
        </p>
      )}
      <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto">
        {fuelLogs.map((f) => (
          <li key={f._id} className="flex items-center justify-between text-sm">
            <span className="text-charcoal">
              {f.liters} L · {formatCurrency(f.cost)}
              {f.odometerReading ? ` · ${f.odometerReading} km` : ''}
              {f.paymentMethod === 'mpesa'
                ? ` · M-Pesa${f.mpesaCode ? ` (${f.mpesaCode})` : ''}`
                : f.paymentMethod === 'cash'
                  ? ' · Cash'
                  : ''}
              {f.receiptPhotoUrl && (
                <a
                  href={f.receiptPhotoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-xs text-lime underline"
                >
                  Receipt
                </a>
              )}
            </span>
            <span className="text-xs text-gray-400">{formatDate(f.createdAt)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
