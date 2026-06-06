import { useCallback, useEffect, useRef, useState } from 'react';
import { monitoringApi } from '../api/client';

function detectMultiMonitor() {
  if (!window.screen) return 'Detection Unavailable';

  const { width, height, availWidth, availHeight } = window.screen;
  const ratio = window.devicePixelRatio || 1;
  const screenArea = width * height;
  const availArea = availWidth * availHeight;

  if (window.screen.isExtended === true) {
    return 'Multiple Displays Possible';
  }

  if (availWidth > width + 100 || availHeight > height + 100) {
    return 'Multiple Displays Possible';
  }

  if (screenArea > 0 && availArea / screenArea < 0.85 && width > 1920) {
    return 'Multiple Displays Possible';
  }

  if (width / ratio > 2560) {
    return 'Multiple Displays Possible';
  }

  return 'Single Display Detected';
}

export function useOAMonitoring(sessionId, enabled = false, { onViolation } = {}) {
  const [compliance, setCompliance] = useState({
    fullscreen: 'pending',
    camera: 'pending',
    microphone: 'pending',
    tabSwitchCount: 0,
    windowFocused: true,
    displayDetection: 'Detection Unavailable',
    events: [],
  });

  const sessionRef = useRef(sessionId);
  sessionRef.current = sessionId;

  const streamRef = useRef(null);
  const violationCooldownRef = useRef(new Map());

  const logEvent = useCallback(async (eventType, metadata = {}) => {
    const sid = sessionRef.current;
    if (!sid) return;

    setCompliance((prev) => ({
      ...prev,
      events: [...prev.events, { type: eventType, timestamp: Date.now(), metadata }],
    }));

    try {
      await monitoringApi.logEvent(sid, eventType, metadata);
    } catch {
      // Monitoring failures should not block assessment flow
    }
  }, []);

  const emitViolation = useCallback(
    (eventType, message) => {
      const now = Date.now();
      const cooldown = violationCooldownRef.current.get(eventType) || 0;
      if (now < cooldown) return;
      violationCooldownRef.current.set(eventType, now + 4000);
      onViolation?.({ eventType, message, timestamp: now });
    },
    [onViolation]
  );

  const attachStreamListeners = useCallback(
    (stream) => {
      if (!stream) return;

      const videoTrack = stream.getVideoTracks?.()[0];
      const audioTrack = stream.getAudioTracks?.()[0];

      if (videoTrack) {
        videoTrack.onended = () => {
          setCompliance((prev) => ({ ...prev, camera: 'warning' }));
          logEvent('camera_ended');
          emitViolation('camera_ended', 'Camera feed stopped. Please re-enable camera access.');
        };
        videoTrack.onmute = () => {
          setCompliance((prev) => ({ ...prev, camera: 'warning' }));
          logEvent('camera_muted');
          emitViolation('camera_muted', 'Camera is muted/blocked. Please turn it back on.');
        };
      }

      if (audioTrack) {
        audioTrack.onended = () => {
          setCompliance((prev) => ({ ...prev, microphone: 'warning' }));
          logEvent('microphone_ended');
          emitViolation(
            'microphone_ended',
            'Microphone feed stopped. Please re-enable microphone access.'
          );
        };
        audioTrack.onmute = () => {
          setCompliance((prev) => ({ ...prev, microphone: 'warning' }));
          logEvent('microphone_muted');
          emitViolation('microphone_muted', 'Microphone is muted/blocked. Please turn it back on.');
        };
      }
    },
    [emitViolation, logEvent]
  );

  const requestPermissions = useCallback(async () => {
    const displayResult = detectMultiMonitor();
    setCompliance((prev) => ({ ...prev, displayDetection: displayResult }));
    await logEvent('multi_monitor_check', { result: displayResult });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current?.getTracks?.().forEach((t) => t.stop());
      streamRef.current = stream;
      setCompliance((prev) => ({
        ...prev,
        camera: 'granted',
        microphone: 'granted',
      }));
      await logEvent('camera_granted');
      await logEvent('microphone_granted');
      attachStreamListeners(stream);
    } catch {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current?.getTracks?.().forEach((t) => t.stop());
        streamRef.current = videoStream;
        setCompliance((prev) => ({ ...prev, camera: 'granted' }));
        await logEvent('camera_granted');
        attachStreamListeners(videoStream);
      } catch {
        setCompliance((prev) => ({ ...prev, camera: 'denied' }));
        await logEvent('camera_denied');
        emitViolation('camera_denied', 'Camera permission denied. Please allow camera access.');
      }

      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (streamRef.current) {
          audioStream.getAudioTracks().forEach((track) => streamRef.current.addTrack(track));
          audioStream.getTracks().forEach((track) => track.stop());
          attachStreamListeners(streamRef.current);
        } else {
          streamRef.current = audioStream;
          attachStreamListeners(audioStream);
        }
        setCompliance((prev) => ({ ...prev, microphone: 'granted' }));
        await logEvent('microphone_granted');
      } catch {
        setCompliance((prev) => ({ ...prev, microphone: 'denied' }));
        await logEvent('microphone_denied');
        emitViolation(
          'microphone_denied',
          'Microphone permission denied. Please allow microphone access.'
        );
      }
    }
  }, [attachStreamListeners, emitViolation, logEvent]);

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setCompliance((prev) => ({ ...prev, fullscreen: 'active' }));
      await logEvent('fullscreen_enter');
      return true;
    } catch {
      setCompliance((prev) => ({ ...prev, fullscreen: 'denied' }));
      return false;
    }
  }, [logEvent]);

  const initializeAssessment = useCallback(async () => {
    await logEvent('assessment_start');
    await requestPermissions();
    return enterFullscreen();
  }, [enterFullscreen, logEvent, requestPermissions]);

  useEffect(() => {
    if (!enabled || !sessionId) return;

    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        setCompliance((prev) => ({ ...prev, fullscreen: 'active' }));
        logEvent('fullscreen_enter');
      } else {
        setCompliance((prev) => ({ ...prev, fullscreen: 'warning' }));
        logEvent('fullscreen_exit');
        emitViolation('fullscreen_exit', 'Fullscreen exited. Please return to fullscreen.');
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        setCompliance((prev) => ({
          ...prev,
          tabSwitchCount: prev.tabSwitchCount + 1,
        }));
        logEvent('visibility_hidden');
        logEvent('tab_switch');
        emitViolation('tab_switch', 'Tab switch detected. Stay on the assessment tab.');
      } else {
        logEvent('visibility_visible');
      }
    };

    const handleBlur = () => {
      setCompliance((prev) => ({ ...prev, windowFocused: false }));
      logEvent('window_blur');
      emitViolation('window_blur', 'Window focus lost. Please stay on the assessment window.');
    };

    const handleFocus = () => {
      setCompliance((prev) => ({ ...prev, windowFocused: true }));
      logEvent('window_focus');
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled, sessionId, emitViolation, logEvent]);

  useEffect(() => {
    if (!enabled) return;
    return () => {
      streamRef.current?.getTracks?.().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [enabled]);

  return { compliance, initializeAssessment, logEvent };
}
