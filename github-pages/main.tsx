import React, { Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import Creator from "../app/components/Creator";
import Respondent from "../app/components/Respondent";
import "../app/globals.css";

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <main className="loading-card"><h1>Este momento puede esperar un poquito.</h1><p>No pudimos abrir la página. Tus respuestas guardadas siguen a salvo.</p><button className="primary-button" onClick={() => window.location.reload()}>Intentar de nuevo</button></main> : this.props.children;
  }
}
const query = new URLSearchParams(window.location.search);
const key = new URLSearchParams(window.location.hash.slice(1)).get("key");
const edit = query.get("edit") === "1" || Boolean(key);
const roomId = query.get("room") || "cb4c4967-27d9-4452-bd1a-ca8e14d43722";
const root = document.getElementById("root");
if (root) createRoot(root).render(<ErrorBoundary>{edit ? <Creator /> : <Respondent roomId={roomId} />}</ErrorBoundary>);
