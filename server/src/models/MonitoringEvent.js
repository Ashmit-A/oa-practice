import mongoose from 'mongoose';

const monitoringEventSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    eventType: {
      type: String,
      enum: [
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
      ],
      required: true,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('MonitoringEvent', monitoringEventSchema);
