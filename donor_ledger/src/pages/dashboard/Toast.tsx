import React, { useEffect } from "react";

type ToastProps = {
  message: string;
  type: "success" | "error";
  onClose: () => void;
};

const Toast = ({ message, type, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg text-white transform transition-transform duration-300
      ${type === "success" ? "bg-green-500" : "bg-red-500"} slide-in`}
    >
      {message}
    </div>
  );
};

export default Toast;
