const { initializeApp } = require("firebase/app");
const { getAnalytics } = require("firebase/analytics");
const { getFirestore  } = require("firebase/firestore");
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDkW_GzvW_Vby2FoeW_JHW4WMLs2eT7De8",
  authDomain: "nft-project-9e107.firebaseapp.com",
  projectId: "nft-project-9e107",
  storageBucket: "nft-project-9e107.appspot.com",
  messagingSenderId: "806810511020",
  appId: "1:806810511020:web:f302d79596a4b87f956109",
  measurementId: "G-TTHE7VRYMB"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore (firebaseApp);
module.exports = {firebaseApp, db};
