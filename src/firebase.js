// Importa las funciones de Firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuración de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB8ZRznHoXDriUoSuO4ku4K_f3TpH4mGSU",
  authDomain: "fir-ventas-9dd14.firebaseapp.com",
  projectId: "fir-ventas-9dd14",
  storageBucket: "fir-ventas-9dd14.appspot.com", // corregido
  messagingSenderId: "700812467281",
  appId: "1:700812467281:web:e0b35324280a0bdd87ac70",
  measurementId: "G-YSVN14CTBQ"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Servicios que usarás
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
