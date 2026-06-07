const statusStyles = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  granted: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  denied: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  info: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  unavailable: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
};

const statusLabels = {
  active: 'Active',
  granted: 'Granted',
  denied: 'Denied',
  pending: 'Pending',
  warning: 'Warning',
  info: 'Info',
  unavailable: 'Unavailable',
};

export default function PermissionStatus({
  label,
  status = 'pending',
  activeLabel,
  inactiveLabel,
}) {
  const displayLabel =
    activeLabel && inactiveLabel
      ? status === 'active' || status === 'granted'
        ? activeLabel
        : inactiveLabel
      : statusLabels[status] || status;

  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2">
      <span className="text-sm text-zinc-300">{label}</span>
      <span
        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
          statusStyles[status] || statusStyles.pending
        }`}
      >
        {displayLabel}
      </span>
    </div>
  );
}
