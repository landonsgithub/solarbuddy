# Solar Buddy: Project Summary & Architecture

## 1. Scoping Status
*   **Objective:** Lead capture. Saving AI chat history: Lead Capture, Lead Storage, Lead Transfer. The project is hooked up to AI but is in the gitignore file to protech keys. If, when and how AI is to be used is unknown at this time. 
*   **Lead Destination:** Email capability is priority 1, Phone Capability is priority 2. Syncing to a calendar service that automatically generates appointments is priority 3. (via webhook/API).
*   **Admin/Dashboard:** Yes, we need an admin dashboard for OUR use. We will be the owners of the database and dashboard.
*   **Mandatory Data:** I have not included user identification details int he front end yet but client_email and client_phone number will be mandatory in the second draft.
*   **Service Area Definition:** We need a more robust CO check, maybe we need to specifically ask the client if they are in Colorado or a different state. The current client also services only a specific part of colorado as well so we will need to think about this functionality. HOWEVER, we DO want to collect all clients from different states in a seperate backend bucket or something similar. Our current potential client only services Western Colorado, but any other solar leads that come in can be valuable to other potential clients. 
*   **AI Chat Scope:** For future drafts. Not priority at this time. The AI chat can be scoped to Solar Information, Local and Federal Solar Laws as well as business information, pricing, zones, times, and their own FAQs.
*   **Legal Consent:** Clients must provide legal consent to store personal data or send follow-up messages.
*   **Authentication:** We need staff and admin authentication (currently the developers).
*   **Funnel Analytics:**  Yes. Priority: Solar Seriousness and area/location. how many start, how many complete, and how many fall outside the target area.
*   **Expected Volume:** *Unknown at this time*.

## 2. Architecture Overview
Solar Buddy is built on a modular React architecture, utilizing the Singleton Pattern for data management. This approach ensures security, scalability, and ease of maintenance.

### A. src/services/sbStore.js (Universal Data Vault)
Manages the universal data state securely outside of the window object.
*   `getAllData()`: Retrieves the full data payload.
*   `getItem(key)`: Fetches a specific value.
*   `updateItem(key, value)`: Dynamically assigns data.
*   `resetData()`: Wipes the store for a new lead.

### B. src/components/SolarDecisionTree.jsx
Contains the business logic for the question flow.
*   `handleAnswer(answerText)`: Processes user input, updates storage, and directs navigation.

### C. src/components/SolarBuddyWidget.jsx
The UI container for the interactive widget.
*   `handleSend()`: Captures user input from the UI and initiates the data flow.

### D. src/services/emailService.js
Handles external communication.
*   `sendLeadEmail(payload)`: Dispatches data to an endpoint via the Fetch API.

## 3. Master Import/Export Reference

| File | Named Exports | Default Export | Primary Imports |
| :--- | :--- | :--- | :--- |
| `sbStore.js` | `sbStore` | - | - |
| `storageService.js` | `storageService` | - | - |
| `emailService.js` | `emailService` | - | - |
| `SolarDecisionTree.jsx` | - | `SolarDecisionTree` | `useState`, `sbStore` |
| `SolarBuddyWidget.jsx` | - | `SolarBuddyWidget` | `useState`, `SolarDecisionTree` |
