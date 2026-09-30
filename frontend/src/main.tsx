import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { App } from "./app/App";
import { AuthProvider } from "./features/auth/AuthContext";
import "./styles/global.css";
import "./styles/readability.css";
import "./styles/privacy.css";
import "./styles/language.css";

// Demo interactiva aislada: no usa sesion ni backend y carga three.js solo al entrar.
const DemoPage = lazy(() => import("./features/demo/DemoPage"));

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route
          path="/demo"
          element={
            <Suspense fallback={null}>
              <DemoPage />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <AuthProvider>
              <App />
            </AuthProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
