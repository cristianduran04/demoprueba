// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";

import Productos from "./Productos";
import Ventas from "./Ventas";
import Produccion from "./Produccion";
import Reportes from "./Reportes";
import Recetas from "./Recetas";
import Login from "./pages/Login";
import "./App.css";
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <p>Cargando...</p>;

  return (
    <Router>
      {user ? (
        <div style={{ display: "flex" }}>
          {/* Menú lateral */}
          <nav
            style={{
              width: "180px",
              background: "#324a7d",
              color: "#fff",
              padding: "20px",
              position: "fixed",
              top: 0,
              left: 0,
              height: "100vh",
              overflowY: "auto",
              boxShadow: "2px 0 6px rgba(0,0,0,0.2)",
            }}
          >
            <h2 style={{ fontSize: "20px", marginBottom: "20px" }}>📌 Menú</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ marginBottom: "15px" }}>
                <Link to="/" style={{ color: "white", textDecoration: "none" }}>
                  🏠 Inicio
                </Link>
              </li>
              <li style={{ marginBottom: "15px" }}>
                <Link to="/productos" style={{ color: "white", textDecoration: "none" }}>
                  📦 Productos
                </Link>
              </li>
              <li style={{ marginBottom: "15px" }}>
                <Link to="/recetas" style={{ color: "white", textDecoration: "none" }}>
                  📑 Recetas
                </Link>
              </li>
              <li style={{ marginBottom: "15px" }}>
                <Link to="/ventas" style={{ color: "white", textDecoration: "none" }}>
                  💰 Ventas
                </Link>
              </li>
              <li style={{ marginBottom: "15px" }}>
                <Link to="/produccion" style={{ color: "white", textDecoration: "none" }}>
                  🏭 Producción
                </Link>
              </li>
              <li style={{ marginBottom: "15px" }}>
                <Link to="/reportes" style={{ color: "white", textDecoration: "none" }}>
                  📊 Reportes
                </Link>
              </li>
            </ul>

            {/* Botón de salir */}
            <button
              style={{
                marginTop: "20px",
                padding: "8px",
                background: "#e74c3c",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                width: "100%",
              }}
              onClick={() => signOut(auth)}
            >
              🚪 Cerrar sesión
            </button>
          </nav>

          {/* Contenido */}
          <main
            style={{
              flex: 1,
              padding: "30px",
              marginLeft: "200px",
              background: "#f4f6f9",
              minHeight: "100vh",
            }}
          >
            <Routes>
              <Route path="/" element={<h1>Bienvenido al Sistema 👋</h1>} />
              <Route path="/productos" element={<Productos />} />
              <Route path="/recetas" element={<Recetas />} />
              <Route path="/ventas" element={<Ventas />} />
              <Route path="/produccion" element={<Produccion />} />
              <Route path="/reportes" element={<Reportes />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
