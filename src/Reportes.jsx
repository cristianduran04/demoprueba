// src/sections/Reportes.jsx
import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";


export default function Reportes(){
  const [movs, setMovs] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);

  useEffect(()=>{
    const u1 = onSnapshot(collection(db, "movimientos"), s => setMovs(s.docs.map(d=>({id:d.id, ...d.data()}))));
    const u2 = onSnapshot(collection(db, "ventas"), s => setVentas(s.docs.map(d=>({id:d.id, ...d.data()}))));
    const u3 = onSnapshot(collection(db, "productos"), s => setProductos(s.docs.map(d=>({id:d.id, ...d.data()}))));
    return ()=>{ u1(); u2(); u3(); };
  },[]);

  const exportCSV = (rows, filename="export.csv") => {
    if(!rows.length) return alert("No hay datos");
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };

  const rowsMov = movs.map(m => ({ fecha: m.fecha, tipo: m.tipo, producto: productos.find(p=>p.id===m.productoId)?.nombre ?? m.productoId, cantidad: m.cantidad, nota: m.nota }));
  const rowsVentas = ventas.map(v => ({ fecha: v.fecha, total: v.total, items: JSON.stringify(v.items) }));

  return (
    <div>
      <h2>Reportes</h2>
      <div className="card">
        <h3>Movimientos</h3>
        <button onClick={()=>exportCSV(rowsMov, "movimientos.csv")}>Exportar CSV</button>
        <table className="table">
          <thead><tr><th>Fecha</th><th>Tipo</th><th>Producto</th><th>Cantidad</th></tr></thead>
          <tbody>
            {rowsMov.map((r,i)=><tr key={i}><td>{new Date(r.fecha).toLocaleString()}</td><td>{r.tipo}</td><td>{r.producto}</td><td>{r.cantidad}</td></tr>)}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Ventas</h3>
        <button onClick={()=>exportCSV(rowsVentas, "ventas.csv")}>Exportar CSV</button>
        <table className="table">
          <thead><tr><th>Fecha</th><th>Total</th><th>Items</th></tr></thead>
          <tbody>
            {ventas.map(v=> <tr key={v.id}><td>{new Date(v.fecha).toLocaleString()}</td><td>{v.total}</td><td>{JSON.stringify(v.items)}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
