// src/pages/Register.jsx
import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

export default function Register(){
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      nav("/");
    } catch (error) {
      setErr(error.message);
    }
  };

  return (
    <div className="center-card">
      <h2>Registrar usuario</h2>
      <form onSubmit={submit} className="form">
        <input placeholder="Correo" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button type="submit">Crear cuenta</button>
        {err && <div className="err">{err}</div>}
      </form>
      <div>¿Ya tienes cuenta? <Link to="/login">Entrar</Link></div>
    </div>
  );
}