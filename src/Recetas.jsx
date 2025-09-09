// src/Recetas.jsx
import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import "./Recetas.css";

export default function Recetas() {
  const [productos, setProductos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [insumo, setInsumo] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [unidad, setUnidad] = useState("kg");
  const [receta, setReceta] = useState([]);
  const [recetasGuardadas, setRecetasGuardadas] = useState([]);

  const [editandoId, setEditandoId] = useState(null);
  const [formEdit, setFormEdit] = useState({ insumo: "", cantidad: "", unidad: "kg" });

  // Cargar solo productos tipo PT
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "productos"), (snap) => {
      const productosData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProductos(productosData.filter((p) => p.tipo === "PT")); // 🔹 solo PT
    });
    return () => unsub();
  }, []);

  // Cargar recetas guardadas del producto seleccionado
  useEffect(() => {
    if (!productoSeleccionado) {
      setRecetasGuardadas([]);
      return;
    }
    const ref = collection(db, "productos", productoSeleccionado, "recetas");
    const unsub = onSnapshot(ref, (snap) => {
      setRecetasGuardadas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [productoSeleccionado]);

  const agregarInsumo = () => {
    if (!insumo || !cantidad) return;
    setReceta([...receta, { insumo, cantidad, unidad }]);
    setInsumo("");
    setCantidad("");
  };

  const guardarReceta = async () => {
    if (!productoSeleccionado || receta.length === 0) return;
    const ref = doc(db, "productos", productoSeleccionado);
    for (const item of receta) {
      await addDoc(collection(ref, "recetas"), item);
    }
    alert("Receta guardada ✅");
    setReceta([]);
  };

  const eliminarReceta = async (id) => {
    const ref = doc(db, "productos", productoSeleccionado, "recetas", id);
    await deleteDoc(ref);
  };

  const empezarEdicion = (receta) => {
    setEditandoId(receta.id);
    setFormEdit({ insumo: receta.insumo, cantidad: receta.cantidad, unidad: receta.unidad });
  };

  const guardarEdicion = async () => {
    if (!editandoId) return;
    const ref = doc(db, "productos", productoSeleccionado, "recetas", editandoId);
    await updateDoc(ref, {
      insumo: formEdit.insumo,
      cantidad: formEdit.cantidad,
      unidad: formEdit.unidad,
    });
    setEditandoId(null);
  };

  return (
    <div className="receta-container">
      <h2>Crear Receta</h2>

      <div className="form-group">
        <label>Seleccionar Producto (PT)</label>
        <select
          value={productoSeleccionado}
          onChange={(e) => setProductoSeleccionado(e.target.value)}
        >
          <option value="">-- Selecciona --</option>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>

      <h3>Agregar Insumos</h3>
      <div className="form-group">
        <input
          type="text"
          placeholder="Insumo"
          value={insumo}
          onChange={(e) => setInsumo(e.target.value)}
        />
        <input
          type="number"
          placeholder="Cantidad"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
        />
        <select value={unidad} onChange={(e) => setUnidad(e.target.value)}>
          <option value="kg">Kg</option>
          <option value="g">g</option>
          <option value="L">L</option>
          <option value="ml">ml</option>
          <option value="un">Unidades</option>
        </select>
        <button className="btn btn-primary" onClick={agregarInsumo}>
          ➕ Agregar
        </button>
      </div>

      {/* Receta en construcción */}
      {receta.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Insumo</th>
              <th>Cantidad</th>
              <th>Unidad</th>
            </tr>
          </thead>
          <tbody>
            {receta.map((r, i) => (
              <tr key={i}>
                <td>{r.insumo}</td>
                <td>{r.cantidad}</td>
                <td>{r.unidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button className="btn btn-success" onClick={guardarReceta}>
        💾 Guardar Receta
      </button>

      {/* 📋 Lista de recetas guardadas */}
      {productoSeleccionado && (
        <div className="recetas-guardadas">
          <h3>📋 Recetas guardadas</h3>
          {recetasGuardadas.length === 0 ? (
            <p>No hay recetas guardadas aún.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Cantidad</th>
                  <th>Unidad</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recetasGuardadas.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {editandoId === r.id ? (
                        <input
                          value={formEdit.insumo}
                          onChange={(e) =>
                            setFormEdit((f) => ({ ...f, insumo: e.target.value }))
                          }
                        />
                      ) : (
                        r.insumo
                      )}
                    </td>
                    <td>
                      {editandoId === r.id ? (
                        <input
                          type="number"
                          value={formEdit.cantidad}
                          onChange={(e) =>
                            setFormEdit((f) => ({ ...f, cantidad: e.target.value }))
                          }
                        />
                      ) : (
                        r.cantidad
                      )}
                    </td>
                    <td>
                      {editandoId === r.id ? (
                        <select
                          value={formEdit.unidad}
                          onChange={(e) =>
                            setFormEdit((f) => ({ ...f, unidad: e.target.value }))
                          }
                        >
                          <option value="kg">Kg</option>
                          <option value="g">g</option>
                          <option value="L">L</option>
                          <option value="ml">ml</option>
                          <option value="un">Unidades</option>
                        </select>
                      ) : (
                        r.unidad
                      )}
                    </td>
                    <td>
                      {editandoId === r.id ? (
                        <>
                          <button className="btn btn-success" onClick={guardarEdicion}>
                            💾 Guardar
                          </button>
                          <button
                            className="btn btn-cancel"
                            onClick={() => setEditandoId(null)}
                          >
                            ❌ Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-edit"
                            onClick={() => empezarEdicion(r)}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => eliminarReceta(r.id)}
                          >
                            🗑️ Eliminar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

