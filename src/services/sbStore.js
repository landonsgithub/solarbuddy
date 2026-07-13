// src/services/sbStore.js

// 1. Initialize from localStorage to survive accidental page refreshes!
const savedData = localStorage.getItem('sb_lead_data');

// 2. Add metadata: Track exactly when this lead started talking
let sb_data = savedData ? JSON.parse(savedData) : {
  created_at: new Date().toISOString() 
};

export const sbStore = {
  // Read the whole payload safely
  getAllData: () => {
    return { ...sb_data }; // 3. Return a protected copy of the data
  },
  
  // Read a specific item
  getItem: (key) => {
    return sb_data[key];
  },

  // Dynamically create OR update any key-value pair
  updateItem: (key, value) => {
    sb_data[key] = value;
    sb_data.last_updated = new Date().toISOString(); // Auto-track latest activity
    
    // Sync to local storage so the lead is safe if the browser refreshes
    localStorage.setItem('sb_lead_data', JSON.stringify(sb_data));
    
    console.log(`sb_data updated! [${key}] is now:`, value);
  },

  // Instantly wipe the slate clean for the next user
  resetData: () => {
    sb_data = { created_at: new Date().toISOString() }; // Reset with a fresh timestamp
    localStorage.removeItem('sb_lead_data'); // Clear the hard drive backup
    console.log("Lead data cleared. Ready for next user.");
  }
};