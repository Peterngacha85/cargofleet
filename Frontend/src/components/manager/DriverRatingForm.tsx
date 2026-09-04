import { useState } from 'react';
import { api } from '@/services/api';
import { useNotificationStore } from '@/stores/notificationStore';

interface DriverRatingFormProps {
  driverId: string;
  tripId: string;
  onRated?: () => void;
}

export default function DriverRatingForm({ driverId, tripId, onRated }: DriverRatingFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const push = useNotificationStore((s) => s.push);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post('/ratings', {
        driverId,
        tripId,
        rating,
        ratedBy: 'manager',
        comment,
        deliveryQuality: rating >= 4 ? 'excellent' : rating >= 3 ? 'good' : 'poor',
        timeliness: 'on_time',
        professionalism: rating >= 4 ? 'excellent' : 'good',
      });
      push(data.message, data.success ? 'success' : 'error');
      if (data.success) onRated?.();
    } catch {
      push('Failed to submit rating', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`text-2xl ${star <= rating ? 'text-lime' : 'text-gray-300'}`}
            aria-label={`Rate ${star} star`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        className="input-field"
        placeholder="Comment on this delivery…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
      />
      <button className="btn-primary self-start" onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit Rating'}
      </button>
    </div>
  );
}
