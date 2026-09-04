interface LoadingSpinnerProps {
  fullScreen?: boolean;
}

export default function LoadingSpinner({ fullScreen = false }: LoadingSpinnerProps) {
  const spinner = (
    <div
      className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-lime"
      role="status"
      aria-label="Loading"
    />
  );

  if (!fullScreen) return spinner;

  return <div className="flex h-screen w-full items-center justify-center bg-soft-gray">{spinner}</div>;
}
