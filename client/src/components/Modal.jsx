export default function Modal({ open, title, message, onClose, confirmLabel = 'OK' }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-700 bg-stone-950/90 p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-stone-100">{title}</h2>
        <p className="mt-3 text-sm text-stone-300">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
