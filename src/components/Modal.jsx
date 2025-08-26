import React from "react";
import Button from "../compoments/Button";

const Modal = ({ isOpen, onClose, children, className = "" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
      <div className={`bg-white rounded-lg p-6 w-full max-w-lg sm:max-w-2xl max-h-[80vh] overflow-y-auto ${className}`}>
        {children}
        <Button onClick={onClose} variant="outline" className="mt-4">Fermer</Button>
      </div>
    </div>
  );
};

export default Modal;
