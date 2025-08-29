import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Productos from "./Productos";
import Ventas from "./Ventas";
import Produccion from "./Produccion";
import Reportes from "./Reportes";

function App() {
  return (
    <Router>
      <div style={{ display: "flex", height: "100vh" }}>
        {/* Menú lateral */}
        <nav
          style={{
            width: "200px",
            background: "#1e3a8a",
            color: "#fff",
            padding: "20px",
          }}
        >
          <h2 style={{ fontSize: "18px", marginBottom: "20px" }}>Menú</h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li style={{ marginBottom: "10px" }}>
              <Link to="/" style={{ color: "white", textDecoration: "none" }}>
                🏠 Inicio
              </Link>
            </li>
            <li style={{ marginBottom: "10px" }}>
              <Link
                to="/productos"
                style={{ color: "white", textDecoration: "none" }}
              >
                📦 Productos
              </Link>
            </li>
            <li style={{ marginBottom: "10px" }}>
              <Link
                to="/ventas"
                style={{ color: "white", textDecoration: "none" }}
              >
                💰 Ventas
              </Link>
            </li>
            <li style={{ marginBottom: "10px" }}>
              <Link
                to="/produccion"
                style={{ color: "white", textDecoration: "none" }}
              >
                🏭 Producción
              </Link>
            </li>
            <li style={{ marginBottom: "10px" }}>
              <Link
                to="/reportes"
                style={{ color: "white", textDecoration: "none" }}
              >
                📊 Reportes
              </Link>
            </li>
          </ul>
        </nav>

        {/* Contenido principal */}
        <main style={{ flex: 1, padding: "20px" }}>
          <Routes>
            <Route path="/" element={<h1>Bienvenido al Sistema 👋</h1>} />
            <Route path="/productos" element={<Productos />} />
            <Route path="/ventas" element={<Ventas />} />
            <Route path="/produccion" element={<Produccion />} />
            <Route path="/reportes" element={<Reportes />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
