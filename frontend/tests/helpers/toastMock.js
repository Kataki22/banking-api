import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Mock du ToastContext pour les tests.
 * Rend les toasts dans le DOM avec les classes error-msg / success-msg
 * pour que les assertions existantes screen.getByText() continuent de fonctionner.
 */

const MockToastCtx = createContext(null);

function MockToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type) => {
    setToasts((prev) => [...prev, { id: Math.random(), message, type }]);
  }, []);

  return React.createElement(
    MockToastCtx.Provider,
    { value: { showToast } },
    children,
    React.createElement(
      'div',
      { 'data-testid': 'toasts' },
      ...toasts.map((t) =>
        React.createElement(
          'div',
          {
            key: t.id,
            'data-testid': 'toast',
            className: t.type === 'success' ? 'success-msg' : 'error-msg',
          },
          React.createElement('span', null, '⚠ '),
          t.message
        )
      )
    )
  );
}

function useToast() {
  const ctx = useContext(MockToastCtx);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

export const toastMock = {
  ToastProvider: MockToastProvider,
  useToast,
};
