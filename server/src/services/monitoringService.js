import MonitoringEvent from '../models/MonitoringEvent.js';
import { AppError } from '../middleware/errorHandler.js';

const VALID_EVENT_TYPES = [
  'fullscreen_enter',
  'fullscreen_exit',
  'camera_granted',
  'camera_denied',
  'microphone_granted',
  'microphone_denied',
  'tab_switch',
  'window_blur',
  'window_focus',
  'visibility_hidden',
  'visibility_visible',
  'multi_monitor_check',
  'assessment_start',
  'assessment_submit',
];

export async function logMonitoringEvent({ sessionId, eventType, metadata = {} }) {
  if (!sessionId) {
    throw new AppError('sessionId is required', 400);
  }

  if (!VALID_EVENT_TYPES.includes(eventType)) {
    throw new AppError(`Invalid event type: ${eventType}`, 400);
  }

  const event = await MonitoringEvent.create({
    sessionId,
    eventType,
    metadata,
    timestamp: new Date(),
  });

  return {
    id: event._id.toString(),
    sessionId: event.sessionId,
    eventType: event.eventType,
    metadata: event.metadata,
    timestamp: event.timestamp,
  };
}

export async function getSessionEvents(sessionId) {
  const events = await MonitoringEvent.find({ sessionId }).sort({ timestamp: 1 }).lean();
  return events;
}
