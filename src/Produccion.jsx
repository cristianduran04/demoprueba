// src/Produccion.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  runTransaction,
  serverTimestamp,
  query,
  orderBy,
  getDocs
} from "firebase/firestore";
import { db, auth } from "./firebase";
import "./Produccion.css";

/* ================================
   Módulo Producción - MVP mejorado
   - Wizard simple para crear OP
   - Tabla de órdenes con acciones rápidas
   - Completar OP con transacción segura
   - QC integrado (modal)
   ==================================*/

// util simple uid
const uid = () => Math.random().toString(36).slice(2, 9);
const fmt = (n) => Number(n ?? 0).toFixed(3);

export default function Produccion() {
  // datos
  const [productos, setProductos] = useState([]); // MP + PT
  const [recetas, setRecetas] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [movs, setMovs] = useState([]);

  // wizard / crear receta
  const [step, setStep] = useState(1); // wizard step: 1 seleccionar PT, 2 revisar receta, 3 confirmar OP
  const [selectedPT, setSelectedPT] = useState("");
  const [qty, setQty] = useState(100);
  const [centro, setCentro] = useState("");
  const [prioridad, setPrioridad] = useState("media");

  // receta builder (si necesitan crear)
  const [recItems, setRecItems] = useState([]);

  // UI
  const [selectedOp, setSelectedOp] = useState(null);
  const [qcNotas, setQcNotas] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // carga en tiempo real
  useEffect(() => {
    const unsubP = onSnapshot(collection(db, "productos"), snap => {
      setProductos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubR = onSnapshot(collection(db, "recetas"), snap => {
      setRecetas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const q = query(collection(db, "ordenes"), orderBy("fechaCreada", "desc"));
    const unsubO = onSnapshot(q, snap => setOrdenes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubM = onSnapshot(collection(db, "movimientos"), snap => setMovs(snap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 300)));
    return () => { unsubP(); unsubR(); unsubO(); unsubM(); };
  }, []);

  // helpers
  const productoById = (id) => productos.find(p => p.id === id) || null;
  const recetaByProducto = (pid) => recetas.find(r => r.productoId === pid) || null;

  // wizard actions
  const startWizard = (ptId = "") => {
    setSelectedPT(ptId);
    setQty(100);
    setCentro("");
    setPrioridad("media");
    setStep(1);
  };

  const goToStep2 = () => {
    if (!selectedPT) return alert("Seleccione un producto terminado (PT).");
    setStep(2);
  };

  // eslint-disable-next-line no-unused-vars
  const goToStep3 = () => {
    if (!qty || qty <= 0) return alert("Cantidad debe ser mayor a 0.");
    setStep(3);
  };

  const createOrdenFromWizard = async () => {
    setLoading(true);
    try {
      const r = recetaByProducto(selectedPT);
      const itemsEstimados = (r?.items ?? []).map(it => ({
        mpId: it.mpId,
        cantPorUnidad: it.cant,
        requerido: Number((it.cant * qty).toFixed(3)),
        consumido: 0
      }));
      const lote = `L${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${uid()}`;
      await addDoc(collection(db, "ordenes"), {
        productoId: selectedPT,
        cantidadPlan: Number(qty),
        cantidadProducida: 0,
        lote,
        estado: "pendiente",
        centroId: centro || "sin-centro",
        fechaCreada: serverTimestamp(),
        fechaProgramada: null,
        prioridad,
        insumos: itemsEstimados,
        versionRecetaId: r?.id || null,
        creadoPor: auth.currentUser?.email || null
      });
      alert(`Orden creada: ${lote}`);
      setStep(1);
      setSelectedPT(""); setQty(100); setCentro(""); setPrioridad("media");
    } catch (err) {
      console.error(err);
      alert("Error creando orden");
    } finally { setLoading(false); }
  };

  // crear receta rápida (si no existe)
  const addRecItem = () => setRecItems(prev => [...prev, { mpId: productos.find(p => p.tipo==="MP")?.id || "", cant: 0 }]);
  const saveReceta = async () => {
    if (!selectedPT) return alert("Seleccione PT");
    const items = recItems.filter(i => i.mpId && Number(i.cant) > 0);
    if (!items.length) return alert("Agregue insumos válidos");
    try {
      await addDoc(collection(db, "recetas"), { productoId: selectedPT, items, version: 1, fechaCreada: serverTimestamp(), autor: auth.currentUser?.email || null });
      alert("Receta guardada.");
      setRecItems([]);
    } catch (err) {
      console.error(err); alert("Error guardando receta");
    }
  };

  // completar orden (transaction)
const completarOrden = async (op) => {
  if (!op) return;
  if (!window.confirm(`¿Completar OP ${op.lote} (${op.cantidadPlan} u.)?`)) return;
  setLoading(true);
  const ordenRef = doc(db, "ordenes", op.id);

  try {
    await runTransaction(db, async (tx) => {
      // ---------- 1. LEER TODO ----------
      const ordSnap = await tx.get(ordenRef);
      if (!ordSnap.exists()) throw new Error("Orden no encontrada");
      const ord = ordSnap.data();
      if (ord.estado !== "pendiente") throw new Error("Orden no está en estado pendiente");

      // leer insumos
      const insumosSnap = [];
      for (const ins of ord.insumos || []) {
        const mpRef = doc(db, "productos", ins.mpId);
        const mpSnap = await tx.get(mpRef);
        insumosSnap.push({ ins, mpRef, mpSnap });
      }

      // leer PT
      const ptRef = doc(db, "productos", ord.productoId);
      const ptSnap = await tx.get(ptRef);

      // ---------- 2. VALIDAR DATOS ----------
      for (const { ins, mpSnap } of insumosSnap) {
        if (!mpSnap.exists()) throw new Error(`MP no encontrada: ${ins.mpId}`);
        const mp = mpSnap.data();
        const stock = Number(mp.stock ?? 0);
        const req = Number(ins.requerido ?? 0);
        if (stock < req) {
          throw new Error(
            `Stock insuficiente ${mp.nombre || ins.mpId}: requiere ${req}, hay ${stock}`
          );
        }
      }
      if (!ptSnap.exists()) throw new Error("Producto terminado no encontrado");

      // ---------- 3. ESCRITURAS ----------
      // actualizar insumos (consumo)
      for (const { ins, mpRef, mpSnap } of insumosSnap) {
        const mp = mpSnap.data();
        const stock = Number(mp.stock ?? 0);
        const req = Number(ins.requerido ?? 0);

        tx.update(mpRef, { stock: stock - req });
        const movRef = doc(collection(db, "movimientos"));
        tx.set(movRef, {
          fecha: serverTimestamp(),
          tipo: "consumo",
          productoId: ins.mpId,
          cantidad: -req,
          nota: `Consumo OP ${ord.lote}`,
          usuario: auth.currentUser?.email || null,
        });
      }

      // aumentar PT
      const pt = ptSnap.data();
      const nuevoStock = Number(pt.stock ?? 0) + Number(ord.cantidadPlan ?? 0);
      tx.update(ptRef, { stock: nuevoStock });
      const movProd = doc(collection(db, "movimientos"));
      tx.set(movProd, {
        fecha: serverTimestamp(),
        tipo: "produccion",
        productoId: ord.productoId,
        cantidad: Number(ord.cantidadPlan ?? 0),
        nota: `Producción OP ${ord.lote}`,
        usuario: auth.currentUser?.email || null,
      });

      // marcar OP completada
      tx.update(ordenRef, {
        estado: "completada",
        cantidadProducida: Number(ord.cantidadPlan ?? 0),
        fechaFin: serverTimestamp(),
      });
    }); // end runTransaction ✅
  } catch (err) {
    console.error("❌ Error al completar orden:", err);
    alert(err.message);
  } finally {
    setLoading(false);
  }
};

      
  // QC simple
  const marcarQC = async (ordenId, aprobado, notas = "") => {
    try {
      await addDoc(collection(db, "inspecciones"), { ordenId, aprobado, notas, usuario: auth.currentUser?.email || null, fecha: serverTimestamp() });
      if (!aprobado) {
        const ordenRef = doc(db, "ordenes", ordenId);
        await updateDoc(ordenRef, { estado: "cuarentena" });
        await addDoc(collection(db, "noConformidades"), { ordenId, fecha: serverTimestamp(), notas, estado: "abierta", usuario: auth.currentUser?.email || null });
        alert("QC: Falló. Lote en cuarentena.");
      } else {
        alert("QC: Aprobado.");
      }
    } catch (err) {
      console.error(err); alert("Error QC");
    } finally {
      setSelectedOp(null);
      setQcNotas("");
    }
  };

  // filtro simple por búsqueda
  const ordenesFiltradas = ordenes.filter(o => {
    if (!search) return true;
    const prod = productoById(o.productoId)?.nombre ?? "";
    return `${o.lote} ${prod}`.toLowerCase().includes(search.toLowerCase());
  });

  // quick seed view (opcional): si no hay productos, mostrar mensaje
  const hasProducts = productos && productos.length > 0;

  return (
    <div className="produccion-container">
      <header className="prod-header">
        <div>
          <h2>Producción</h2>
          <p className="muted">Creación rápida de órdenes, consumo automático de MP y control de calidad.</p>
        </div>

        <div className="prod-actions">
          <button onClick={() => startWizard("")}>Nueva Orden (wizard)</button>
          <button onClick={async () => {
            // quick reload manual de productos (en caso de usar getDocs)
            const snap = await getDocs(collection(db, "productos"));
            setProductos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            alert("Recargado");
          }}>Recargar</button>
        </div>
      </header>

      {/* WIZARD / CREAR */}
      <section className="card wizard">
        <h3>Crear Orden (wizard rápido)</h3>

        {!hasProducts && <div className="warn">No hay productos cargados. Por favor agregue productos en Inventario.</div>}

        <div className="wizard-steps">
          <div className={`step ${step===1? "active": ""}`}>
            <label>1. Seleccione PT</label>
            <select value={selectedPT} onChange={e=>setSelectedPT(e.target.value)}>
              <option value="">-- Seleccione producto terminado (PT) --</option>
              {productos.filter(p=>p.tipo==="PT").map(p => <option key={p.id} value={p.id}>{p.sku} — {p.nombre}</option>)}
            </select>
            <div className="hint">También puede crear receta si no existe (despliegue abajo).</div>
            <div className="wizard-nav"><button onClick={goToStep2}>Siguiente</button></div>
          </div>

          <div className={`step ${step===2? "active": ""}`}>
            <label>2. Revisar / Crear receta (BOM)</label>
            {recetaByProducto(selectedPT) ? (
              <div className="receta-box">
                <strong>Receta existente:</strong>
                <ul>
                  {recetaByProducto(selectedPT).items.map((it,i) => {
                    const mp = productoById(it.mpId);
                    return <li key={i}>{mp?.sku ?? it.mpId} — {mp?.nombre ?? "MP"} : {fmt(it.cant)} por unidad (stock: {fmt(mp?.stock ?? 0)})</li>;
                  })}
                </ul>
              </div>
            ) : (
              <div className="receta-builder">
                <p className="muted">No existe receta. Agregue insumos rápidos:</p>
                {recItems.map((it, idx) => (
                  <div className="rec-row" key={idx}>
                    <select value={it.mpId} onChange={e=> setRecItems(arr => arr.map((x,i)=> i===idx ? {...x, mpId:e.target.value} : x))}>
                      <option value="">-- Seleccione MP --</option>
                      {productos.filter(p => p.tipo==="MP").map(mp => <option key={mp.id} value={mp.id}>{mp.sku} — {mp.nombre}</option>)}
                    </select>
                    <input type="number" step="0.001" value={it.cant} onChange={e=> setRecItems(arr => arr.map((x,i)=> i===idx ? {...x, cant: e.target.value} : x))} />
                  </div>
                ))}
                <div className="receta-actions">
                  <button onClick={addRecItem}>Añadir insumo</button>
                  <button onClick={saveReceta} disabled={!recItems.length}>Guardar receta</button>
                </div>
              </div>
            )}
            <div className="wizard-nav">
              <button onClick={() => setStep(1)}>Atrás</button>
              <button onClick={() => setStep(3)}>Siguiente</button>
            </div>
          </div>

          <div className={`step ${step===3? "active": ""}`}>
            <label>3. Confirmar OP</label>
            <div className="confirm-grid">
              <div>
                <strong>Producto:</strong> {productoById(selectedPT)?.nombre || "-"}
              </div>
              <div>
                <label>Cantidad a producir</label>
                <input type="number" value={qty} onChange={e=>setQty(e.target.value)} />
              </div>
              <div>
                <label>Centro</label>
                <input value={centro} onChange={e=>setCentro(e.target.value)} placeholder="Centro de trabajo (opcional)" />
              </div>
              <div>
                <label>Prioridad</label>
                <select value={prioridad} onChange={e=>setPrioridad(e.target.value)}>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
            </div>

            <div className="wizard-nav">
              <button onClick={() => setStep(2)}>Atrás</button>
              <button onClick={createOrdenFromWizard} disabled={loading}>{loading ? "Creando..." : "Crear Orden"}</button>
            </div>
          </div>
        </div>
      </section>

      {/* Tabla de órdenes y filtros */}
      <section className="card">
        <div className="table-header">
          <h3>Órdenes de Producción</h3>
          <div>
            <input placeholder="Buscar por lote o producto..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
        </div>

        <table className="op-table">
          <thead>
            <tr><th>Fecha</th><th>Lote</th><th>Producto</th><th>Plan</th><th>Producido</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {ordenesFiltradas.map(op => {
              const prod = productoById(op.productoId);
              return (
                <tr key={op.id}>
                  <td>{op.fechaCreada ? new Date(op.fechaCreada.seconds * 1000).toLocaleString() : "-"}</td>
                  <td>{op.lote}</td>
                  <td>{prod?.sku} — {prod?.nombre}</td>
                  <td>{op.cantidadPlan}</td>
                  <td>{op.cantidadProducida ?? 0}</td>
                  <td><span className={`badge estado-${op.estado}`}>{op.estado}</span></td>
                  <td className="actions">
                    {op.estado === "pendiente" ? (
                      <>
                        <button className="btn-primary" onClick={() => completarOrden(op)}>Completar Producción</button>
                        <button onClick={() => setSelectedOp(op)}>QC</button>
                      </>
                    ) : (
                      <button onClick={() => setSelectedOp(op)}>Ver / QC</button>
                    )}
                  </td>
                </tr>
              );
            })}
            {ordenesFiltradas.length === 0 && <tr><td colSpan={7} className="muted">No hay órdenes</td></tr>}
          </tbody>
        </table>
      </section>

      {/* Detalle + QC modal (inline) */}
      {selectedOp && (
        <section className="card qc-card">
          <div className="qc-header">
            <h3>Detalle — Lote {selectedOp.lote}</h3>
            <div>
              <button onClick={() => { setSelectedOp(null); setQcNotas(""); }}>Cerrar</button>
            </div>
          </div>

          <div className="detalle-grid">
            <div>
              <strong>Producto:</strong> {productoById(selectedOp.productoId)?.nombre}
            </div>
            <div>
              <strong>Cantidad plan:</strong> {selectedOp.cantidadPlan}
            </div>
            <div>
              <strong>Centro:</strong> {selectedOp.centroId}
            </div>
            <div>
              <strong>Prioridad:</strong> {selectedOp.prioridad}
            </div>

            <div style={{ gridColumn: "1 / -1", marginTop: 8 }}>
              <h4>Insumos</h4>
              <ul>
                {(selectedOp.insumos || []).map((it, i) => {
                  const mp = productoById(it.mpId);
                  return <li key={i}>{mp?.sku} — {mp?.nombre} : requerido {fmt(it.requerido)} (consumido {fmt(it.consumido ?? 0)}) — stock: {fmt(mp?.stock ?? 0)}</li>;
                })}
              </ul>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <h4>Inspección / QC</h4>
              <textarea className="qc-textarea" placeholder="Notas de QC..." value={qcNotas} onChange={e=>setQcNotas(e.target.value)} />
              <div className="qc-actions">
                <button className="btn-primary" onClick={() => marcarQC(selectedOp.id, true, qcNotas)}>Marcar Aprobado</button>
                <button className="btn-warn" onClick={() => marcarQC(selectedOp.id, false, qcNotas)}>Marcar Rechazado</button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Movimientos */}
      <section className="card">
        <h3>Movimientos recientes</h3>
        <div className="movimientos">
          <table>
            <thead><tr><th>Fecha</th><th>Tipo</th><th>Producto</th><th>Cantidad</th><th>Nota</th></tr></thead>
            <tbody>
              {movs.map(m => {
                const prod = productoById(m.productoId);
                return <tr key={m.id}><td>{m.fecha ? new Date(m.fecha.seconds * 1000).toLocaleString() : "-"}</td><td>{m.tipo}</td><td>{prod?.nombre ?? m.productoId}</td><td>{m.cantidad}</td><td>{m.nota}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

