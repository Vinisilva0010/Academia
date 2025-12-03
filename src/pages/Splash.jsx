// src/pages/Splash.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const Splash = () => {
  const navigate = useNavigate();

  const handleEnter = () => {
    navigate("/login");
  };

  const handleDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Fundo com gradiente animado */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500 via-black to-emerald-900 bg-[length:400%_400%] animate-gradient opacity-80" />

      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Conteúdo */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        {/* “Luzes” suaves */}
        <div className="pointer-events-none absolute -left-10 top-10 h-60 w-60 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 right-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />

        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-emerald-400">
          Bem-vindo à
        </p>

        <h1 className="bg-gradient-to-r from-emerald-400 via-white to-emerald-500 bg-clip-text text-center text-5xl font-extrabold uppercase tracking-widest text-transparent drop-shadow-[0_0_18px_rgba(16,185,129,0.7)] sm:text-6xl md:text-7xl animate-pulse-slow">
          Immersion Fit
        </h1>

        <p className="mt-6 max-w-xl text-center text-sm text-gray-300 sm:text-base">
        A tecnologia que impulsiona sua performance.
        </p>

        <div className="mt-8 h-px w-40 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <button
            onClick={handleEnter}
            className="rounded-full bg-emerald-500 px-8 py-3 text-sm font-semibold uppercase tracking-wide text-black shadow-[0_0_25px_rgba(16,185,129,0.8)] transition-transform transition-shadow hover:scale-105 hover:shadow-[0_0_40px_rgba(16,185,129,1)]"
          >
            Entrar
          </button>

          <button
            type="button"
            onClick={handleDashboard}
            className="rounded-full border border-emerald-400/60 px-8 py-3 text-sm font-semibold uppercase tracking-wide text-emerald-200/90 backdrop-blur-sm transition-colors hover:border-emerald-300 hover:text-emerald-100"
          >
            Ver painel (se já logado)
          </button>
        </div>

        <p className="mt-8 text-xs text-gray-500">
          Clique em entrar para fazer login e começar sua imersão.
        </p>
      </div>
    </div>
  );
};

export default Splash;
