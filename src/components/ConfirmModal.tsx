import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isDanger?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  isDanger = false
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="confirm-modal-overlay" onClick={onCancel} />
      <div className="confirm-modal-card">
        <h3 className="confirm-modal-title">{title}</h3>
        <p className="confirm-modal-body">{message}</p>
        <div className="confirm-modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            style={isDanger ? { backgroundColor: 'var(--color-badge-danger-text)', color: '#ffffff' } : {}}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </>
  );
};
