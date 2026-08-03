import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ConfirmProvider } from "./contexts/ConfirmContext";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ConfirmProvider>
              <App />
              <Toaster
                position="top-right"
                closeButton
                theme="dark"
                toastOptions={{
                  style: {
                    background: "rgba(10, 10, 10, 0.8)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    color: "#f8fafc",
                    borderRadius: "16px",
                    padding: "12px 16px",
                    fontSize: "14px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                  },
                  className: "font-sans tracking-tight",
                }}
              />{" "}
            </ConfirmProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
