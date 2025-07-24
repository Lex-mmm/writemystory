/**
 * Client-side WhatsApp Feature Configuration
 * This checks if WhatsApp functionality should be shown in the UI
 */

export const CLIENT_WHATSAPP_CONFIG = {
  // We'll use build-time environment variable for client
  isEnabled: process.env.NEXT_PUBLIC_WHATSAPP_ENABLED === 'true',
  
  // Get user-friendly disabled message
  getDisabledMessage: () => {
    return 'WhatsApp functionality is temporarily disabled. Please use email forwarding or manual story input instead.';
  },
  
  // Check if WhatsApp features should be shown
  shouldShowWhatsAppFeatures: () => {
    return CLIENT_WHATSAPP_CONFIG.isEnabled;
  }
};

export default CLIENT_WHATSAPP_CONFIG;
