const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.baseUrl = 'https://graph.facebook.com/v18.0';
  }

  /**
   * Send WhatsApp message using WhatsApp Business API
   * @param {string} phoneNumber - Recipient phone number (with country code)
   * @param {string} message - Message content
   * @returns {Promise<Object>} - API response
   */
  async sendMessage(phoneNumber, message) {
    try {
      // Format phone number (remove + and ensure it starts with country code)
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('WhatsApp message sent successfully:', response.data);
      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('WhatsApp API error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Send OTP message template
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} otp - 6-digit OTP code
   * @param {string} userName - User's name
   * @param {string} type - Type of OTP (pin_reset, password_reset, etc.)
   * @returns {Promise<Object>} - API response
   */
  async sendOTP(phoneNumber, otp, userName, type = 'pin_reset') {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      let message;
      let templateName;

      switch (type) {
        case 'pin_reset':
          templateName = 'phc_pin_reset';
          message = `🔐 PHC Mobile - Reset PIN

Halo ${userName},

Anda telah meminta reset PIN untuk akun PHC Mobile Anda.

Kode OTP Anda adalah: *${otp}*

Kode ini akan kadaluarsa dalam 10 menit.

Jika Anda tidak meminta reset PIN ini, abaikan pesan ini.

Terima kasih,
Tim PHC Mobile`;
          break;

        case 'password_reset':
          templateName = 'phc_password_reset';
          message = `🔐 PHC Mobile - Reset Password

Halo ${userName},

Anda telah meminta reset password untuk akun PHC Mobile Anda.

Kode OTP Anda adalah: *${otp}*

Kode ini akan kadaluarsa dalam 10 menit.

Jika Anda tidak meminta reset password ini, abaikan pesan ini.

Terima kasih,
Tim PHC Mobile`;
          break;

        default:
          templateName = 'phc_general_otp';
          message = `🔐 PHC Mobile - Kode Verifikasi

Halo ${userName},

Kode OTP Anda adalah: *${otp}*

Kode ini akan kadaluarsa dalam 10 menit.

Jika Anda tidak meminta kode ini, abaikan pesan ini.

Terima kasih,
Tim PHC Mobile`;
      }

      // Try to send using template first (if available)
      const templateResponse = await this.sendTemplateMessage(formattedPhone, templateName, {
        user_name: userName,
        otp_code: otp
      });

      if (templateResponse.success) {
        return templateResponse;
      }

      // Fallback to text message
      return await this.sendMessage(phoneNumber, message);

    } catch (error) {
      console.error('Send OTP error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send template message
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} templateName - Template name
   * @param {Object} parameters - Template parameters
   * @returns {Promise<Object>} - API response
   */
  async sendTemplateMessage(phoneNumber, templateName, parameters) {
    try {
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: 'id'
          },
          components: [
            {
              type: 'body',
              parameters: Object.keys(parameters).map(key => ({
                type: 'text',
                text: parameters[key]
              }))
            }
          ]
        }
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('WhatsApp template message sent successfully:', response.data);
      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('WhatsApp template API error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Format phone number for WhatsApp API
   * @param {string} phoneNumber - Raw phone number
   * @returns {string} - Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // If number starts with 0, replace with 62 (Indonesia country code)
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    
    // If number doesn't start with country code, assume it's Indonesian
    if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Verify WhatsApp Business API configuration
   * @returns {Promise<Object>} - Verification result
   */
  async verifyConfiguration() {
    try {
      if (!this.phoneNumberId || !this.accessToken) {
        return {
          success: false,
          error: 'WhatsApp configuration missing. Please set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN environment variables.'
        };
      }

      // Test API connection
      const url = `${this.baseUrl}/${this.phoneNumberId}`;
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return {
        success: true,
        data: response.data,
        message: 'WhatsApp Business API configuration is valid'
      };

    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
        message: 'WhatsApp Business API configuration is invalid'
      };
    }
  }

  /**
   * Get message templates
   * @returns {Promise<Object>} - Templates list
   */
  async getTemplates() {
    try {
      const url = `${this.baseUrl}/${this.phoneNumberId}/message_templates`;
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }
}

module.exports = new WhatsAppService();
