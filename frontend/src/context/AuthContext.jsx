import { createContext, useContext, useState, useEffect } from "react";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("nyaj_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  function signIn(compte) {
    localStorage.setItem("nyaj_user", JSON.stringify(compte));
    setUser(compte);
  }

  function signOut() {
    localStorage.removeItem("nyaj_user");
    setUser(null);
  }

  function updateUser(compte) {
    localStorage.setItem("nyaj_user", JSON.stringify(compte));
    setUser(compte);
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
