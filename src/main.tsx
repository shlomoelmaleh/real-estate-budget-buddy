import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Ensure the app cannot be installed as a PWA: unregister any previously registered service workers
// and clear related caches that might keep the installable experience alive for returning visitors.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
    });
  });
}

if ("caches" in window) {
  caches.keys().then((keys) => {
    keys.forEach((key) => {
      // best-effort cleanup; ignore errors
      caches.delete(key);
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
