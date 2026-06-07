export default function SideDrawer({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md border-l border-zinc-800 bg-zinc-950/95 shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-900"
          >
            Close
          </button>
        </div>
        <div className="h-[calc(100%-52px)] overflow-auto p-4">{children}</div>
      </aside>
    </div>
  );
}
