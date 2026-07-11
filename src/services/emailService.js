// src/services/emailService.js
import { storageService } from './storageService';

export const emailService = {
  /**
   * Sends the lead data to the email endpoint and manages cache clearing
   */
  sendLeadEmail: async () => {
    const payload = storageService.getLeadData();

    if (!payload || !payload.data) {
      console.warn("No lead data found to send.");
      return { success: false, message: "No data" };
    }

    try {
      console.log("Attempting to send lead data...", payload);

      // Replace this URL with your actual email endpoint (like EmailJS or a serverless function)
      const response = await fetch('https://your-api-endpoint.com/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API returned status: ${response.status}`);
      }

      const result = await response.json();

      // SUCCESS: The email was delivered! Now we strictly clear the cache.
      console.log("Email sent successfully!");
      storageService.clearLeadData();
      
      return { success: true, data: result };

    } catch (error) {
      // ERROR: The API failed (offline, server down, etc.)
      // Notice we DO NOT clear the local storage here. The lead data remains safe.
      console.error("Failed to send email. Lead data retained in local storage.", error);
      return { success: false, error: error.message };
    }
  }
};