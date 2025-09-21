import React from "react";
import Router from "./router.jsx";
import AuthProvider from "./context/AuthContext.jsx";
export default function App(){ return (<AuthProvider><Router/></AuthProvider>); }
