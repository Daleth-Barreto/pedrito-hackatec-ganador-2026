import { BRAND_NAME } from "../components/Brand";
import { useEffect } from "react";
import { LanguageBar } from "../i18n/LanguageBar";
import { installValidation } from "../i18n/validation";
import { t, useLocale } from "../i18n/runtime";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { LoginPage } from "../features/auth/LoginPage";
import { PatientHome } from "../features/patient/PatientHome";
import { DashboardPage } from "../features/clinical-dashboard/DashboardPage";
import { NewRecordPage } from "../features/records/NewRecordPage";
import { HistoryPage } from "../features/records/HistoryPage";
import { RecordDetailPage } from "../features/records/RecordDetailPage";
import { Loading, Notice } from "../components/UI";
import { AccountPage } from "../features/patient/AccountPage";
import { PrivacyNotice } from "../features/patient/PrivacyNotice";
import { RegisterPage } from "../features/auth/RegisterPage";
import { Layout } from "./Layout";
import { LandingPage } from "../features/landing/LandingPage";
function Protected({ patient = false }: { patient?: boolean }) {
  useLocale();
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (patient && user.role !== "patient") return <Navigate to="/" replace />;
  return <Outlet />;
}
function AppScreens() {
  useLocale();
  const { user, loading, error, reload } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <Loading text={t("App.preparando_tu_espacio")} />;
  // La landing es publica: se muestra aunque el servicio no responda.
  if (error && pathname === "/") return <LandingPage />;
  if (error)
    return (
      <main className="service-error">
        <h1>{t("App.no_se_pudo_cargar_tu_espacio")}</h1>
        <Notice kind="error">{error}</Notice>
        <button className="button primary" onClick={reload}>
          {t("App.volver_a_intentar")}
        </button>
      </main>
    );
  return (
    <Routes>
      <Route path="/privacy" element={<PrivacyNotice />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      {!user && <Route index element={<LandingPage />} />}
      <Route element={<Protected />}>
        <Route element={<Layout />}>
          {user && (
            <Route
              index
              element={
                user.role === "clinician" ? <DashboardPage /> : <PatientHome />
              }
            />
          )}
          <Route path="/records/:id" element={<RecordDetailPage />} />
          <Route element={<Protected patient />}>
            <Route path="/records/new" element={<NewRecordPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  const locale = useLocale();
  useEffect(() => {
    document.title = `${BRAND_NAME} · ${t("Layout.seguimiento_de_heridas_postamputacion")}`;
  }, [locale]);
  useEffect(installValidation, []);
  return (
    <>
      <LanguageBar />
      <AppScreens />
    </>
  );
}
