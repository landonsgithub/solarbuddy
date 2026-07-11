// src/services/storageService.js

const STORAGE_KEY = 'sb_lead_data';

export const storageService = {
  /**
   * Initializes or updates a specific field in local storage
   */
  saveAnswer: (id, value) => {
    try {
      // Fetch existing data or initialize the 'sb' object
      const existingData = localStorage.getItem(STORAGE_KEY);
      const sb = existingData ? JSON.parse(existingData) : { data: {} };

      // We use bracket notation here dynamically, which successfully builds 
      // the object as sb.data.service_type, sb.data.monthly_bill, etc.
      sb.data[id] = value;

      // Save it back
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sb));
      console.log(`Saved ${id} to local storage. Current lead object:`, sb.data);
    } catch (error) {
      console.error("Error saving to local storage:", error);
    }
  },

  /**
   * Retrieves the full formatted payload for the email API
   */
  getLeadData: () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Safely wipes the cache only after a successful API post
   */
  clearLeadData: () => {
    localStorage.removeItem(STORAGE_KEY);
    console.log("Cache cleared successfully. Ready for next lead.");
  }
};