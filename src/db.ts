// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Para Firestore

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAlXg8SABKyiquaTmA5rYszqpEW6vNyVcA",
  authDomain: "gymbros-8ba38.firebaseapp.com",
  projectId: "gymbros-8ba38",
  storageBucket: "gymbros-8ba38.firebasestorage.app",
  messagingSenderId: "601963470081",
  appId: "1:601963470081:web:80f70463f416e9c5068f00"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };