export default function Loader({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-brand-500" />
      <p className="mt-4 text-sm text-slate-400">{message}</p>
    </div>
  );
}
