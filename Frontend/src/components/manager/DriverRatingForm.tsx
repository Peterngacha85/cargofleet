import { useState } from 'react';
import { api } from '@/services/api';
import { useNotificationStore } from '@/stores/notificationStore';
import Select from '@/components/shared/Select';
import FieldLabel from '@/components/shared/FieldLabel';

interface DriverRatingFormProps {
  driverId: string;
  tripId: string;
  onRated?: () => void;
}

const timelinessOptions = [
  { value: 'on_time', label: 'On Time' },
  { value: 'slightly_late', label: 'Slightly Late' },
  { value: 'very_late', label: 'Very Late' },
];

const positiveTags = ['On time', 'Careful with cargo', 'Professional', 'Good communication', 'Friendly'];
const negativeTags = ['Late', 'Damaged goods', 'Rude', 'Poor communication', 'Reckless driving'];

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function DriverRatingForm({ driverId, tripId, onRated }: DriverRatingFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [timeliness, setTimeliness] = useState('on_time');
  const [positiveAspects, setPositiveAspects] = useState<string[]>([]);
  const [negativeAspects, setNegativeAspects] = useState<string[]>([]);
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
        timeliness,
        professionalism: rating >= 4 ? 'excellent' : 'good',
        positiveAspects,
        negativeAspects,
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

      <div>
        <FieldLabel>Timeliness</FieldLabel>
        <Select value={timeliness} onChange={setTimeliness} options={timelinessOptions} />
      </div>

      <div>
        <FieldLabel>What went well?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {positiveTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setPositiveAspects((prev) => toggle(prev, tag))}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                positiveAspects.includes(tag) ? 'bg-lime text-charcoal' : 'bg-soft-gray text-gray-600'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>Any issues?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {negativeTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setNegativeAspects((prev) => toggle(prev, tag))}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                negativeAspects.includes(tag) ? 'bg-red-100 text-red-700' : 'bg-soft-gray text-gray-600'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
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
