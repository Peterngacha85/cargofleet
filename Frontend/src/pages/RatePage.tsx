import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { PublicService } from '@/services/publicService';
import { PublicRatingInfo } from '@/types/public';
import SignatureCanvas, { SignatureCanvasHandle } from '@/components/shared/SignatureCanvas';

const positiveTags = ['On time', 'Careful with cargo', 'Professional', 'Good communication', 'Friendly'];
const negativeTags = ['Late', 'Damaged goods', 'Rude', 'Poor communication', 'Reckless driving'];

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function RatePage() {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<PublicRatingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [positiveAspects, setPositiveAspects] = useState<string[]>([]);
  const [negativeAspects, setNegativeAspects] = useState<string[]>([]);
  const [hasSignature, setHasSignature] = useState(false);
  const signatureRef = useRef<SignatureCanvasHandle>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    PublicService.getRatingInfo(token)
      .then((res) => {
        if (res.success && res.data) {
          setInfo(res.data);
        } else {
          setError(res.message || 'Rating link not found or expired.');
        }
      })
      .catch(() => setError('Rating link not found or expired.'));
  }, [token]);

  const handleSubmit = async () => {
    if (!token) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const response = await PublicService.submitRating(token, {
        rating,
        comment: comment || undefined,
        customerName: customerName || undefined,
        positiveAspects,
        negativeAspects,
        signatureDataUrl: hasSignature ? signatureRef.current?.getDataUrl() ?? undefined : undefined,
      });
      if (response.success) {
        setSubmitted(true);
      } else {
        setSubmitError(response.message);
      }
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || 'Failed to submit your rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-soft-gray p-4">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-center">
          <p className="font-semibold text-charcoal">CargoFleet</p>
        </div>

        {error && <p className="card text-sm text-red-600">{error}</p>}

        {!error && !info && <p className="card text-sm text-gray-500">Loading…</p>}

        {info && info.tripStatus !== 'completed' && (
          <div className="card text-center">
            <p className="text-sm text-gray-500">This trip hasn't been completed yet - check back once it's delivered.</p>
          </div>
        )}

        {info && info.tripStatus === 'completed' && (info.alreadyRated || submitted) && (
          <div className="card flex flex-col items-center gap-2 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-lime" />
            <p className="font-medium text-charcoal">Thank you for your feedback!</p>
          </div>
        )}

        {info && info.tripStatus === 'completed' && !info.alreadyRated && !submitted && (
          <div className="card flex flex-col gap-4">
            <div>
              <p className="font-semibold text-charcoal">{info.tripNumber}</p>
              <p className="text-sm text-gray-500">How was your delivery{info.driverName ? ` with ${info.driverName}` : ''}?</p>
            </div>

            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-3xl ${star <= rating ? 'text-lime' : 'text-gray-300'}`}
                  aria-label={`Rate ${star} star`}
                >
                  ★
                </button>
              ))}
            </div>

            <div>
              <p className="mb-1 text-sm font-medium text-charcoal">What went well?</p>
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
              <p className="mb-1 text-sm font-medium text-charcoal">Any issues?</p>
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

            <input
              className="input-field"
              placeholder="Your name (optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />

            <textarea
              className="input-field"
              placeholder="Any other comments…"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <div>
              <p className="mb-1 text-sm font-medium text-charcoal">Signature (optional)</p>
              <SignatureCanvas ref={signatureRef} onChange={setHasSignature} />
            </div>

            {submitError && <p className="text-sm text-red-600">{submitError}</p>}

            <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Rating'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
