import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./swRegistration.ts"; // Register service worker

const root = createRoot(document.getElementById("root"));
root.render(<App />);
