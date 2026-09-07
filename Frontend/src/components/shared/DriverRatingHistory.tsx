import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { DriverService } from '@/services/driverService';
import { DriverRating, DriverRatingsResponse } from '@/types/rating';
import { formatDate, statusLabel } from '@/utils/formatters';

interface DriverRatingHistoryProps {
  driverId: string;
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-3.5 w-3.5 ${n <= count ? 'fill-lime text-lime' : 'text-gray-300'}`} />
      ))}
    </div>
  );
}

export default function DriverRatingHistory({ driverId }: DriverRatingHistoryProps) {
  const [data, setData] = useState<DriverRatingsResponse | null>(null);

  useEffect(() => {
    DriverService.getRatings(driverId).then((res) => {
      if (res.data) setData(res.data);
    });
  }, [driverId]);

  if (!data) return <p className="text-sm text-gray-400">Loading ratings…</p>;
  if (data.totalRatings === 0) return <p className="text-sm text-gray-400">No ratings yet.</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = data.ratingDistribution[star] ?? 0;
          const pct = data.totalRatings > 0 ? Math.round((count / data.totalRatings) * 100) : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-8 flex-shrink-0">{star}★</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-soft-gray">
                <div className="h-full rounded-full bg-lime" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-6 flex-shrink-0 text-right">{count}</span>
            </div>
          );
        })}
      </div>

      <ul className="flex max-h-80 flex-col gap-3 overflow-y-auto">
        {data.ratings.map((r: DriverRating) => (
          <li key={r._id} className="rounded-lg border border-gray-100 p-3">
            <div className="flex items-center justify-between gap-2">
              <Stars count={r.rating} />
              <span className="text-xs text-gray-400">
                {r.ratedBy === 'customer' ? 'Customer' : 'Manager'} · {formatDate(r.createdAt)}
              </span>
            </div>
            {r.comment && <p className="mt-2 text-sm text-charcoal">{r.comment}</p>}
            {(r.positiveAspects?.length || r.negativeAspects?.length) && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.positiveAspects?.map((tag) => (
                  <span key={tag} className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    {tag}
                  </span>
                ))}
                {r.negativeAspects?.map((tag) => (
                  <span key={tag} className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-1 text-xs text-gray-400">
              Timeliness: {statusLabel(r.timeliness)} · Delivery: {statusLabel(r.deliveryQuality)}
              {r.customerName && ` · ${r.customerName}`}
            </p>
            {r.customerSignature?.startsWith('http') && (
              <a
                href={r.customerSignature}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block rounded-md border border-gray-200 p-1"
              >
                <img src={r.customerSignature} alt="Customer signature" className="h-12 w-auto" />
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
