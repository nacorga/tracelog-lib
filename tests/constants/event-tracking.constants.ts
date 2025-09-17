export const VALID_EVENT_NAMES = [
  'user_signup',
  'button_click',
  'page_view_custom',
  'form_submit',
  'video_play',
  'download_started',
  'search_performed',
  'cart_item_added',
  'checkout_completed',
  'user_login',
];

export const EDGE_CASE_METADATA = {
  emptyString: '',
  zeroNumber: 0,
  negativeNumber: -123,
  floatNumber: 3.14159,
  booleanTrue: true,
  booleanFalse: false,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  unicode: '你好世界 🌍 café naïve',
};

export const SANITIZATION_TEST_CASES = [
  {
    name: 'html_content',
    metadata: {
      content: 'Normal text <script>alert("xss")</script> more text',
      description: 'This should be sanitized',
    },
  },
  {
    name: 'special_chars',
    metadata: {
      message: 'User input with "quotes" and \'apostrophes\' and symbols @#$%',
      data: 'Normal content should remain',
    },
  },
  {
    name: 'unicode_content',
    metadata: {
      text: 'Unicode content: 你好 🎉 café naïve résumé',
      emoji: '😀🎯🚀',
    },
  },
];

// Event validation limits (from src/constants/limits.constants.ts)
export const MAX_CUSTOM_EVENT_NAME_LENGTH = 120;
export const MAX_CUSTOM_EVENT_STRING_SIZE = 8 * 1024; // 8KB
export const MAX_CUSTOM_EVENT_KEYS = 10;
export const MAX_CUSTOM_EVENT_ARRAY_SIZE = 10;
export const MAX_STRING_LENGTH = 1000;

// Test timing constants
export const EVENT_PROCESSING_WAIT_MS = 1000;
export const BATCH_PROCESSING_WAIT_MS = 2000;
export const BURST_PROCESSING_WAIT_MS = 4000;
