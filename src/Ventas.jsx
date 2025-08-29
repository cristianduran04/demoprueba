import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import "./Ventas.css"; // Asegúrate de tener esta ruta correcta

export default function Ventas() {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [cliente, setCliente] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");

  // cargar productos
  useEffect(() => {
    const fetchProductos = async () => {
      const querySnapshot = await getDocs(collection(db, "productos"));
      setProductos(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchProductos();
  }, []);

  // agregar producto al carrito
  const agregarAlCarrito = (producto) => {
    const existe = carrito.find(item => item.id === producto.id);
    if (existe) {
      setCarrito(carrito.map(item =>
        item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
      ));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  // calcular total
  const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  // registrar venta
  const registrarVenta = async () => {
    if (carrito.length === 0) return alert("Agrega productos al carrito");
    try {
      await addDoc(collection(db, "ventas"), {
        cliente,
        metodoPago,
        productos: carrito,
        total,
        fecha: serverTimestamp(),
      });
      alert("Venta registrada con éxito");
      setCarrito([]);
      setCliente("");
      setMetodoPago("efectivo");
    } catch (error) {
      console.error("Error al registrar la venta", error);
    }
  };

  return (
    <div className="ventas-container">
      {/* Panel catálogo */}
      <div className="panel catalogo">
        <h2>Catálogo</h2>
        {productos.map((p) => (
          <div key={p.id} className="product-card">
            <div className="product-info">
              <h4>{p.nombre}</h4>
              <p>${p.precio}</p>
            </div>
            <button className="btn-agregar" onClick={() => agregarAlCarrito(p)}>
              Agregar
            </button>
          </div>
        ))}
      </div>

      {/* Panel carrito */}
      <div className="panel carrito">
        <h2>Carrito</h2>
        {carrito.length === 0 ? (
          <p>No hay productos</p>
        ) : (
          carrito.map((item) => (
            <div key={item.id} className="carrito-item">
              <span>{item.nombre} x {item.cantidad}</span>
              <span>${item.precio * item.cantidad}</span>
            </div>
          ))
        )}
        <div className="total">Total: ${total}</div>
        {carrito.length > 0 && (
          <button className="btn-vaciar" onClick={() => setCarrito([])}>
            Vaciar carrito
          </button>
        )}
      </div>

      {/* Panel datos cliente */}
      <div className="panel datos-venta">
        <h2>Datos de venta</h2>
        <label>Cliente</label>
        <input
          type="text"
          placeholder="Nombre del cliente"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
        />
        <label>Método de pago</label>
        <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="transferencia">Transferencia</option>
        </select>
        <label>Observaciones</label>
        <textarea placeholder="Notas adicionales..."></textarea>
        <button className="btn-finalizar" onClick={registrarVenta}>
          Finalizar venta
        </button>
      </div>
    </div>
  );
}

