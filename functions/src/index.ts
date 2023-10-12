const functions = require('firebase-functions');
const admin = require('firebase-admin');
// Initialize Firebase
admin.initializeApp(functions.config().firebase);
const db = admin.firestore()
const settings = {timestampsInSnapshots: true};
db.settings(settings);
