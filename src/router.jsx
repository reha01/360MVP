import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ROUTES } from "./constants/routes.js";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Evaluation from "./pages/Evaluation.jsx";
import ReportView from "./pages/ReportView.jsx";
import Credits from "./pages/Credits.jsx";

export default function Router(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.HOME} element={<Home/>} />
        <Route path={ROUTES.LOGIN} element={<Login/>} />
        <Route path={ROUTES.REGISTER} element={<Register/>} />
        <Route path={ROUTES.DASHBOARD} element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
        <Route path={ROUTES.EVALUATION} element={<ProtectedRoute><Evaluation/></ProtectedRoute>} />
        <Route path={ROUTES.REPORT} element={<ProtectedRoute><ReportView/></ProtectedRoute>} />
        <Route path={ROUTES.CREDITS} element={<ProtectedRoute><Credits/></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
