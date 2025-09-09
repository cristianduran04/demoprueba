// src/sections/Reportes.jsx
import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function Reportes() {
  const [movs, setMovs] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "movimientos"), (s) =>
      setMovs(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const u2 = onSnapshot(collection(db, "ventas"), (s) =>
      setVentas(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const u3 = onSnapshot(collection(db, "productos"), (s) =>
      setProductos(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);

  // Exportar CSV
  const exportCSV = (rows, filename = "export.csv") => {
    if (!rows.length) return alert("No hay datos");
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Datos agregados
  const totalVentas = ventas.reduce((acc, v) => acc + Number(v.total || 0), 0);
  const totalMovs = movs.length;
  const totalProductos = productos.length;

  // Ventas por día (para gráfico de barras)
  const ventasPorDia = Object.values(
    ventas.reduce((acc, v) => {
      const fecha = new Date(v.fecha).toLocaleDateString();
      acc[fecha] = acc[fecha] || { fecha, total: 0 };
      acc[fecha].total += Number(v.total || 0);
      return acc;
    }, {})
  );

  // Movimientos por tipo (para gráfico de torta)
  const movsPorTipo = Object.values(
    movs.reduce((acc, m) => {
      acc[m.tipo] = acc[m.tipo] || { tipo: m.tipo, cantidad: 0 };
      acc[m.tipo].cantidad += 1;
      return acc;
    }, {})
  );

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div>
      <h2>📊 Reportes y Estadísticas</h2>

      {/* Tarjetas resumen */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
        <div className="card" style={{ textAlign: "center" }}>
          <h3>Total Ventas</h3>
          <p style={{ fontSize: "22px", fontWeight: "bold", color: "#10b981" }}>
            ${totalVentas.toFixed(2)}
          </p>
          <button onClick={() => exportCSV(ventas, "ventas.csv")}>
            Descargar CSV
          </button>
        </div>

        <div className="card" style={{ textAlign: "center" }}>
          <h3>Movimientos</h3>
          <p style={{ fontSize: "22px", fontWeight: "bold", color: "#3b82f6" }}>
            {totalMovs}
          </p>
          <button onClick={() => exportCSV(movs, "movimientos.csv")}>
            Descargar CSV
          </button>
        </div>

        <div className="card" style={{ textAlign: "center" }}>
          <h3>Productos</h3>
          <p style={{ fontSize: "22px", fontWeight: "bold", color: "#f59e0b" }}>
            {totalProductos}
          </p>
          <button onClick={() => exportCSV(productos, "productos.csv")}>
            Descargar CSV
          </button>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
        {/* Ventas por día */}
        <div className="card">
          <h3>Ventas por día</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ventasPorDia}>
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Movimientos por tipo */}
        <div className="card">
          <h3>Movimientos por tipo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={movsPorTipo}
                dataKey="cantidad"
                nameKey="tipo"
                outerRadius={120}
                fill="#8884d8"
                label
              >
                {movsPorTipo.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
