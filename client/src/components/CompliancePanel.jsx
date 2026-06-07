import PermissionStatus from './PermissionStatus';

export default function CompliancePanel({ compliance }) {
  const {
    fullscreen,
    camera,
    microphone,
    tabSwitchCount,
    windowFocused,
    displayDetection,
  } = compliance;

  return (
    <aside className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
      <h2 className="mb-4 text-sm font-semibold uppercase text-zinc-300">
        Compliance
      </h2>

      <div className="space-y-3">
        <PermissionStatus label="Fullscreen" status={fullscreen} />
        <PermissionStatus label="Camera" status={camera} />
        <PermissionStatus label="Microphone" status={microphone} />
        <PermissionStatus
          label="Window Focus"
          status={windowFocused ? 'active' : 'warning'}
          activeLabel="Focused"
          inactiveLabel="Unfocused"
        />
        <PermissionStatus
          label="Display Detection"
          status="info"
          activeLabel={displayDetection}
          inactiveLabel={displayDetection}
        />

        <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
          <p className="text-xs text-zinc-400">Tab Switches</p>
          <p className="text-2xl font-semibold text-amber-400">{tabSwitchCount}</p>
        </div>
      </div>

      {displayDetection && (
        <p className="mt-3 text-xs leading-5 text-zinc-500">
          Multi-monitor detection is informational only and may be inaccurate due to browser
          security limitations.
        </p>
      )}
    </aside>
  );
}
