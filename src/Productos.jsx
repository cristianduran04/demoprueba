import React, { useEffect, useState } from "react";
import { collection, addDoc, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import "./Productos.css";

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({
    sku: "",
    nombre: "",
    tipo: "PT",
    unidad: "UN",
    color: "",
    precio: 0,
    stock: 0,
    minStock: 0,
    medida: "",      // NUEVO para MP
    pesoUnidad: 0,   // NUEVO para MP
  });

  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({});

  useEffect(() => {
    const q = collection(db, "productos");
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProductos(arr);
    });
    return () => unsub();
  }, []);

  const add = async () => {
    if (!form.sku || !form.nombre) return alert("SKU y nombre obligatorios");
    await addDoc(collection(db, "productos"), {
      ...form,
      precio: Number(form.precio),
      stock: Number(form.stock),
      minStock: Number(form.minStock),
      pesoUnidad: form.tipo === "MP" ? Number(form.pesoUnidad) : null,
    });
    setForm({
      sku: "",
      nombre: "",
      tipo: "PT",
      unidad: "UN",
      color: "",
      precio: 0,
      stock: 0,
      minStock: 0,
      medida: "",
      pesoUnidad: 0,
    });
  };

  const quickEntrada = async (id) => {
    const cant = Number(prompt("Cantidad de entrada", "10") || 0);
    if (!cant) return;
    const ref = doc(db, "productos", id);
    const p = productos.find((x) => x.id === id);
    await updateDoc(ref, { stock: (p.stock ?? 0) + cant });
    await addDoc(collection(db, "movimientos"), {
      fecha: new Date().toISOString(),
      tipo: "entrada",
      productoId: id,
      cantidad: cant,
      nota: "Entrada rápida",
    });
  };

  const abrirEditar = (producto) => {
    setEditando(producto);
    setFormEdit(producto);
  };

  const guardarEdicion = async () => {
    const ref = doc(db, "productos", editando.id);
    await updateDoc(ref, {
      ...formEdit,
      precio: Number(formEdit.precio),
      stock: Number(formEdit.stock),
      minStock: Number(formEdit.minStock),
      pesoUnidad: formEdit.tipo === "MP" ? Number(formEdit.pesoUnidad) : null,
    });
    setEditando(null);
  };

  return (
    <div>
      <h2>Productos</h2>

      {/* === FORMULARIO NUEVO PRODUCTO === */}
      <div className="card">
        <h3>Nuevo producto</h3>
        <div className="grid">
          <div>
            <label>SKU</label>
            <input
              placeholder="Ej: 1001"
              value={form.sku}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
            />
          </div>
          <div>
            <label>Nombre</label>
            <input
              placeholder="Ej: Botella plástica"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            />
          </div>
          <div>
            <label>Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
            >
              <option value="PT">Producto Terminado (PT)</option>
              <option value="MP">Materia Prima (MP)</option>
            </select>
          </div>

          {/* SOLO SI ES MP */}
          {form.tipo === "MP" && (
            <>
              <div>
                <label>Unidad de medida</label>
                <select
                  value={form.unidad}
                  onChange={(e) => setForm((f) => ({ ...f, unidad: e.target.value }))}
                >
                  <option value="KG">Kg</option>
                  <option value="G">Gramos</option>
                  <option value="L">Litros</option>
                  <option value="ML">Mililitros</option>
                  <option value="M">Metros</option>
                  <option value="CM">Centímetros</option>
                  <option value="UN">Unidades</option>
                </select>
              </div>
              <div>
                <label>Peso / Cantidad por unidad</label>
                <input
                  type="number"
                  placeholder="Ej: 25 (kg)"
                  value={form.pesoUnidad}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, pesoUnidad: e.target.value }))
                  }
                />
              </div>
            </>
          )}

          <div>
            <label>Stock</label>
            <input
              type="number"
              placeholder="Ej: 50"
              value={form.stock}
              onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
            />
          </div>
          <div>
            <label>Precio</label>
            <input
              placeholder="Ej: 12000"
              type="number"
              value={form.precio}
              onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))}
            />
          </div>
          <div>
            <label>Stock mínimo</label>
            <input
              placeholder="Ej: 5"
              type="number"
              value={form.minStock}
              onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <button onClick={add}>Agregar</button>
        </div>
      </div>

      {/* === LISTADO === */}
      <div className="card">
        <h3>Listado</h3>
        <table className="table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Unidad</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id}>
                <td>{p.sku}</td>
                <td>{p.nombre}</td>
                <td>{p.tipo}</td>
                <td>{p.unidad}</td>
                <td>
                  {p.stock} {p.unidad}
                </td>
                <td className="acciones">
                  <button onClick={() => quickEntrada(p.id)}>Entrada</button>
                  <button className="btn-edit" onClick={() => abrirEditar(p)}>Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* === MODAL EDICIÓN === */}
      {editando && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Editar producto</h3>
            <div className="grid">
              <div>
                <label>SKU</label>
                <input
                  value={formEdit.sku}
                  onChange={(e) =>
                    setFormEdit((f) => ({ ...f, sku: e.target.value }))
                  }
                />
              </div>
              <div>
                <label>Nombre</label>
                <input
                  value={formEdit.nombre}
                  onChange={(e) =>
                    setFormEdit((f) => ({ ...f, nombre: e.target.value }))
                  }
                />
              </div>
              <div>
                <label>Tipo</label>
                <select
                  value={formEdit.tipo}
                  onChange={(e) =>
                    setFormEdit((f) => ({ ...f, tipo: e.target.value }))
                  }
                >
                  <option value="PT">Producto Terminado (PT)</option>
                  <option value="MP">Materia Prima (MP)</option>
                </select>
              </div>

              {formEdit.tipo === "MP" && (
                <>
                  <div>
                    <label>Unidad de medida</label>
                    <select
                      value={formEdit.unidad}
                      onChange={(e) =>
                        setFormEdit((f) => ({ ...f, unidad: e.target.value }))
                      }
                    >
                      <option value="KG">Kg</option>
                      <option value="G">Gramos</option>
                      <option value="L">Litros</option>
                      <option value="ML">Mililitros</option>
                      <option value="M">Metros</option>
                      <option value="CM">Centímetros</option>
                      <option value="UN">Unidades</option>
                    </select>
                  </div>
                  <div>
                    <label>Peso / Cantidad por unidad</label>
                    <input
                      type="number"
                      value={formEdit.pesoUnidad}
                      onChange={(e) =>
                        setFormEdit((f) => ({ ...f, pesoUnidad: e.target.value }))
                      }
                    />
                  </div>
                </>
              )}

              <div>
                <label>Stock</label>
                <input
                  type="number"
                  value={formEdit.stock}
                  onChange={(e) =>
                    setFormEdit((f) => ({ ...f, stock: e.target.value }))
                  }
                />
              </div>
              <div>
                <label>Precio</label>
                <input
                  type="number"
                  value={formEdit.precio}
                  onChange={(e) =>
                    setFormEdit((f) => ({ ...f, precio: e.target.value }))
                  }
                />
              </div>
              <div>
                <label>Stock mínimo</label>
                <input
                  type="number"
                  value={formEdit.minStock}
                  onChange={(e) =>
                    setFormEdit((f) => ({ ...f, minStock: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={guardarEdicion}>Guardar</button>
              <button className="btn-cancel" onClick={() => setEditando(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
