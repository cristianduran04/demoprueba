// src/pages/Dashboard.jsx
import React, { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import Productos from "../Productos";
import Produccion from "../Produccion";
import Ventas from "../Ventas";
import Reportes from "../Reportes";
import Recetas from "../Recetas"; // 👈 Importamos Recetas
import "./Dashboard.css";

export default function Dashboard({ user }) {
  const [tab, setTab] = useState("productos");

  return (
    <div>
      <header className="topbar">
        <div>
          <h1>Sistema Inventario – Demo</h1>
          <small>{user?.email}</small>
        </div>
        <div>
          <button onClick={() => setTab("productos")}>Productos</button>
          <button onClick={() => setTab("recetas")}>Recetas</button> {/* 👈 Nuevo */}
          <button onClick={() => setTab("produccion")}>Producción</button>
          <button onClick={() => setTab("ventas")}>Ventas</button>
          <button onClick={() => setTab("reportes")}>Reportes</button>
          <button onClick={() => signOut(auth)}>Cerrar sesión</button>
        </div>
      </header>

      <main className="container">
        {tab === "productos" && <Productos />}
        {tab === "recetas" && <Recetas />}   {/* 👈 Render de recetas */}
        {tab === "produccion" && <Produccion />}
        {tab === "ventas" && <Ventas />}
        {tab === "reportes" && <Reportes />}
      </main>
    </div>
  );
}

