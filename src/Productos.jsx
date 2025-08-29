// src/sections/Productos.jsx
import React, { useEffect, useState } from "react";
import { collection, addDoc, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";


export default function Productos(){
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({ sku:"", nombre:"", tipo:"PT", unidad:"UN", color:"", precio:0, stock:0, minStock:0 });

  useEffect(() => {
    const q = collection(db, "productos");
    const unsub = onSnapshot(q, snap => {
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProductos(arr);
    });
    return () => unsub();
  }, []);

  const add = async () => {
    if(!form.sku || !form.nombre) return alert("SKU y nombre obligatorios");
    await addDoc(collection(db, "productos"), { ...form, precio: Number(form.precio), stock: Number(form.stock), minStock: Number(form.minStock) });
    setForm({ sku:"", nombre:"", tipo:"PT", unidad:"UN", color:"", precio:0, stock:0, minStock:0 });
  };

  const quickEntrada = async (id) => {
    const cant = Number(prompt("Cantidad de entrada", "10") || 0);
    if(!cant) return;
    const ref = doc(db, "productos", id);
    // obtener stock actual localmente para sumar (más robusto: usar transaction)
    const p = productos.find(x=>x.id===id);
    await updateDoc(ref, { stock: (p.stock ?? 0) + cant });
    // tambien grabar movimiento en colección 'movimientos'
    await addDoc(collection(db, "movimientos"), { fecha: new Date().toISOString(), tipo: "entrada", productoId: id, cantidad: cant, nota: "Entrada rápida" });
  };

  return (
    <div>
      <h2>Productos</h2>
      <div className="card">
        <h3>Nuevo producto</h3>
        <div className="grid">
          <input placeholder="SKU" value={form.sku} onChange={e=>setForm(f=>({...f, sku:e.target.value}))} />
          <input placeholder="Nombre" value={form.nombre} onChange={e=>setForm(f=>({...f, nombre:e.target.value}))} />
          <select value={form.tipo} onChange={e=>setForm(f=>({...f, tipo:e.target.value}))}><option value="PT">PT</option><option value="MP">MP</option></select>
          <input type="number" placeholder="Stock" value={form.stock} onChange={e=>setForm(f=>({...f, stock:e.target.value}))} />
          <input placeholder="Precio" type="number" value={form.precio} onChange={e=>setForm(f=>({...f, precio:e.target.value}))} />
          <input placeholder="Stock mínimo" type="number" value={form.minStock} onChange={e=>setForm(f=>({...f, minStock:e.target.value}))} />
        </div>
        <div>
          <button onClick={add}>Agregar</button>
        </div>
      </div>

      <div className="card">
        <h3>Listado</h3>
        <table className="table">
          <thead><tr><th>SKU</th><th>Nombre</th><th>Tipo</th><th>Stock</th><th>Acciones</th></tr></thead>
          <tbody>
            {productos.map(p=>(
              <tr key={p.id}>
                <td>{p.sku}</td>
                <td>{p.nombre}</td>
                <td>{p.tipo}</td>
                <td>{p.stock}</td>
                <td>
                  <button onClick={()=>quickEntrada(p.id)}>Entrada</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
