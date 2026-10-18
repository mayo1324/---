'use strict';
/* ===== settings for the test launch ===== */
const APP_VERSION = 'גרסת ניסוי 0.9';
const BUILD_DATE = '__BUILD_DATE__';
/* where friends can send feedback. Leave empty to offer only "share" and "copy".
   FEEDBACK_EMAIL: an address for the mail button. FEEDBACK_WHATSAPP: a phone number with country code and no plus, for example 9725XXXXXXXX. */
const FEEDBACK_EMAIL = '';
const FEEDBACK_WHATSAPP = '972584363245';

/* Firebase web app settings (public identifiers, not secrets; access is protected by authorized domains and Firestore rules).
   Analytics is NOT used. */
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDJablsF0GQ1xNTHiedOM6cFKCjTWVXsT8',
  authDomain: 'learn-markets.firebaseapp.com',
  projectId: 'learn-markets',
  storageBucket: 'learn-markets.firebasestorage.app',
  messagingSenderId: '228220691798',
  appId: '1:228220691798:web:5c3d6002085c61ab0222f7'
};
