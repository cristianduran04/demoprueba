// src/pages/Login.jsx
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

export default function Login(){
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      nav("/");
    } catch (error) {
      setErr(error.message);
    }
  };

  return (
    <div className="center-card">
      <h2>Iniciar sesión</h2>
      <form onSubmit={submit} className="form">
        <input placeholder="Correo" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button type="submit">Entrar</button>
        {err && <div className="err">{err}</div>}
      </form>
      <div>¿No tienes cuenta? <Link to="/register">Regístrate</Link></div>
    </div>
  );
}