import React, { createContext, useContext, useState, useCallback } from "react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

interface ToastContextType {
  showMessage: (message: string, type?: "success" | "error") => void;
}

const ToastContext = createContext<ToastContextType>({ showMessage: () => {} });

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showMessage = useCallback((message: string, type: "success" | "error" = "error") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showMessage }}>
      {children}
      <div className="fixed top-4 right-4 flex flex-col gap-2 pointer-events-none" style={{ zIndex: 2147483647 }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg border animate-slide-right ${
              toast.type === "error"
                ? "bg-red-500/90 border-red-400/50 text-white"
                : "bg-emerald-500/90 border-emerald-400/50 text-white"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
