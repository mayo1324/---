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

/* demo shortcuts in the profile (unlock all topics, open portfolio): hidden for everyone; open the app once with ?demo=1 to show them on this device */
let DEMO_TOOLS = false; try { if (/[?&]demo=1/.test(location.search)) localStorage.setItem('cm_demo', '1'); DEMO_TOOLS = localStorage.getItem('cm_demo') === '1'; } catch (e) { }

/* daily pace: how many NEW lessons and NEW practice cases open each day (finished ones are always open). Premium and the demo shortcut skip it. */
const PACE = { lessons: 1, cases: 1 };
