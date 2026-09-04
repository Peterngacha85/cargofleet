interface MarkerPopupProps {
  driverName: string;
  speed?: number;
  lastUpdated?: string;
}

export default function MarkerPopup({ driverName, speed, lastUpdated }: MarkerPopupProps) {
  return (
    <div className="text-sm">
      <p className="font-semibold text-charcoal">{driverName}</p>
      {typeof speed === 'number' && <p className="text-gray-500">Speed: {Math.round(speed)} km/h</p>}
      {lastUpdated && <p className="text-gray-400">Updated: {new Date(lastUpdated).toLocaleTimeString()}</p>}
    </div>
  );
}
