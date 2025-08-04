// src/services/api.ts
// This file now exports the Firebase service instead of the HTTP API service
// to use Firebase directly for data access

import firebaseService from './firebaseService';

// Export Firebase service as the default API service
export default firebaseService;
