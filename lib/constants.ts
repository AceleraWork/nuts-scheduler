export const WEEKLY_TARGET_HOURS = 44;

export const HOURS_INDICATOR_THRESHOLDS = {
  green: { min: 40, max: 46 },
  yellow: [
    { min: 36, max: 39 },
    { min: 47, max: 50 },
  ],
} as const;
