/**
 * WhatsApp Feature Configuration
 * Centralized control for WhatsApp functionality
 */

export const WHATSAPP_CONFIG = {
  // Check if WhatsApp is enabled via environment variable
  isEnabled: process.env.WHATSAPP_ENABLED === 'true',
  
  // Check if Twilio credentials are available
  hasCredentials: !!(
    process.env.TWILIO_ACCOUNT_SID && 
    process.env.TWILIO_AUTH_TOKEN && 
    process.env.TWILIO_WHATSAPP_NUMBER
  ),
  
  // Overall WhatsApp availability (both enabled and has credentials)
  isAvailable: function() {
    return this.isEnabled && this.hasCredentials;
  },
  
  // Get disabled reason for user feedback
  getDisabledReason: function() {
    if (!this.isEnabled) {
      return 'WhatsApp functionality is currently disabled';
    }
    if (!this.hasCredentials) {
      return 'WhatsApp configuration is incomplete';
    }
    return null;
  }
};

export default WHATSAPP_CONFIG;
