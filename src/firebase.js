import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAw5fhcY5rm0glQW61AR6nbHQLDIRcm_Mw",
  authDomain: "phrm-399e5.firebaseapp.com",
  projectId: "phrm-399e5",
  storageBucket: "phrm-399e5.firebasestorage.app",
  messagingSenderId: "141528249149",
  appId: "1:141528249149:web:c8f40952d8cc995dfe0b54",
  measurementId: "G-LHPZ61T63E"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);


export { auth, db, storage, ref, uploadBytes, getDownloadURL };

