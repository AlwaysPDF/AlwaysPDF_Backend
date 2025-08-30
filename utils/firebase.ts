// firebase.js
import admin from "firebase-admin";

import * as dotenv from "dotenv";
dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    // privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // clientId: process.env.FIREBASE_SENDER_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // e.g. your-app.appspot.com
});

const firebase = admin.storage().bucket();

export default firebase; // Changed from 'firebase' to 'bucket' to match usage in uploadToFirebase.js
