// Mobile-specific constants for the restaurant management application

// Touch target sizes following iOS HIG and Material Design guidelines
export const TOUCH_TARGETS = {
  MINIMUM: 44,     // Minimum recommended touch target size
  SMALL: 36,       // Small touch targets for dense layouts
  COMFORTABLE: 48, // Comfortable touch target size
  LARGE: 56,       // Large touch targets for primary actions
  EXTRA_LARGE: 64, // Extra large for critical actions
} as const;

// Screen breakpoints matching Tailwind configuration
export const SCREEN_BREAKPOINTS = {
  XS: 320,   // Extra small phones
  SM: 640,   // Large phones
  MD: 768,   // Tablets
  LG: 1024,  // Small laptops
  XL: 1280,  // Desktops
  XXL: 1536, // Large screens
} as const;

// Mobile layout dimensions
export const LAYOUT_DIMENSIONS = {
  BOTTOM_NAV_HEIGHT: 64,
  MOBILE_HEADER_HEIGHT: 56,
  TABLET_HEADER_HEIGHT: 64,
  SIDEBAR_WIDTH_MOBILE: 280,
  SIDEBAR_WIDTH_TABLET: 320,
  SAFE_AREA_PADDING: 16,
  CARD_PADDING_MOBILE: 16,
  CARD_PADDING_TABLET: 24,
  SECTION_SPACING_MOBILE: 16,
  SECTION_SPACING_TABLET: 24,
} as const;

// Animation durations for mobile interactions
export const ANIMATION_DURATIONS = {
  FAST: 150,     // Quick transitions
  NORMAL: 250,   // Standard transitions
  SLOW: 350,     // Slower transitions for complex animations
  DRAWER: 300,   // Drawer/sidebar animations
  MODAL: 200,    // Modal animations
} as const;

// Z-index layers for mobile components
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  TOAST: 1080,
} as const;

// Mobile-specific spacing scale
export const MOBILE_SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
} as const;

// Input types for mobile keyboards
export const INPUT_MODES = {
  TEXT: 'text',
  NUMERIC: 'numeric',
  DECIMAL: 'decimal',
  EMAIL: 'email',
  TEL: 'tel',
  URL: 'url',
  SEARCH: 'search',
} as const;

// Haptic feedback patterns
export const HAPTIC_PATTERNS = {
  LIGHT: [10],
  MEDIUM: [20],
  HEAVY: [30, 10, 30],
  SUCCESS: [10, 5, 10],
  ERROR: [50, 20, 50],
} as const;

// Performance thresholds for mobile
export const PERFORMANCE_THRESHOLDS = {
  TOUCH_RESPONSE_TIME: 100,    // Maximum touch response time in ms
  SCROLL_FPS: 60,              // Target scroll frame rate
  LOAD_TIME_FAST: 1000,        // Fast load time in ms
  LOAD_TIME_ACCEPTABLE: 2000,  // Acceptable load time in ms
  MEMORY_LIMIT: 100 * 1024 * 1024, // 100MB memory limit
} as const;

// Gesture thresholds
export const GESTURE_THRESHOLDS = {
  SWIPE_MIN_DISTANCE: 50,      // Minimum swipe distance in pixels
  SWIPE_MAX_TIME: 300,         // Maximum swipe time in ms
  LONG_PRESS_DURATION: 500,    // Long press duration in ms
  DOUBLE_TAP_MAX_DELAY: 300,   // Maximum delay between taps for double tap
} as const;

// Network conditions for mobile optimization
export const NETWORK_CONDITIONS = {
  SLOW_3G: {
    downloadThroughput: 400 * 1024,  // 400 KB/s
    uploadThroughput: 400 * 1024,    // 400 KB/s
    latency: 400,                    // 400ms
  },
  FAST_3G: {
    downloadThroughput: 1.6 * 1024 * 1024, // 1.6 MB/s
    uploadThroughput: 750 * 1024,           // 750 KB/s
    latency: 150,                           // 150ms
  },
} as const;

// Mobile-specific validation rules
export const VALIDATION_RULES = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_INPUT_LENGTH: 1000,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[\d\s\-\(\)\+]+$/,
  MIN_PHONE_DIGITS: 10,
} as const;