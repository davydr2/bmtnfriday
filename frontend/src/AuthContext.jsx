import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, signInWithRedirect, signOut, fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadUser() {
    try {
      const u = await getCurrentUser();
      const session = await fetchAuthSession();
      const claims = session.tokens?.idToken?.payload || {};
      const groups = claims['cognito:groups'] || [];
      setUser({ ...u, isAdmin: groups.includes('admin') });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
    const unsub = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn') loadUser();
      if (payload.event === 'signedOut') setUser(null);
    });
    return unsub;
  }, []);

  const login = () => signInWithRedirect();
  const logout = () => signOut();

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
