import { useEffect, useRef, useState } from 'react';

export default function CameraPreview() {
  const videoRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let stream;

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError(err.message || 'Camera permission denied');
      }
    };

    start();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
        <p className="text-xs font-semibold text-slate-300">Camera Preview</p>
        <p className="mt-1 text-xs text-slate-500">
          This preview is local only and is not recorded or uploaded.
        </p>
      </div>
      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
          {error}
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="aspect-video w-full rounded-xl border border-slate-800 bg-black object-cover"
        />
      )}
    </div>
  );
}

