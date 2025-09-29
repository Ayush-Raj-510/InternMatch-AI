import React, { createContext, useContext, useEffect, useState } from 'react';

type User = { id: string; email: string; name?: string } | null;

type AuthContextValue = {
  user: User;
  signup: (email: string, password: string, name?: string) => Promise<{ ok: boolean; error?: string }>;
  signin: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signout: () => void;
  sendOtp: (email: string, action: 'signup' | 'signin', password?: string, name?: string) => Promise<{ ok: boolean; error?: string }>;
  verifyOtp: (email: string, code: string) => Promise<{ ok: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function loadUsers(): Record<string, { email: string; password: string; name?: string }> {
  try {
    return JSON.parse(localStorage.getItem('im.users') || '{}');
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, { email: string; password: string; name?: string }>) {
  try {
    localStorage.setItem('im.users', JSON.stringify(users));
  } catch {}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(() => {
    try {
      return JSON.parse(localStorage.getItem('im.user') || 'null');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('im.user', JSON.stringify(user));
    } catch {}
  }, [user]);

  async function signup(email: string, password: string, name?: string) {
    const users = loadUsers();
    const key = Object.keys(users).find((k) => users[k].email === email);
    if (key) return { ok: false, error: 'User already exists' };
    const id = `u_${Date.now()}`;
    users[id] = { email, password, name };
    saveUsers(users);
    setUser({ id, email, name });
    return { ok: true };
  }

  async function signin(email: string, password: string) {
    const users = loadUsers();
    const found = Object.entries(users).find(([, v]) => v.email === email && v.password === password);
    if (!found) return { ok: false, error: 'Invalid credentials' };
    const [id, info] = found;
    setUser({ id, email: info.email, name: info.name });
    return { ok: true };
  }

  // OTP helpers stored in localStorage for demo purposes
  type PendingOtp = { code: string; expiresAt: number; action: 'signup' | 'signin'; password?: string; name?: string };

  function loadOtps(): Record<string, PendingOtp> {
    try {
      return JSON.parse(localStorage.getItem('im.otps') || '{}');
    } catch { return {}; }
  }
  function saveOtps(m: Record<string, PendingOtp>) {
    try { localStorage.setItem('im.otps', JSON.stringify(m)); } catch {}
  }

  async function sendOtp(email: string, action: 'signup' | 'signin', password?: string, name?: string) {
    // generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 1000 * 60 * 5; // 5 minutes
    const otps = loadOtps();
    otps[email] = { code, expiresAt, action, password, name };
    saveOtps(otps);

    // For demo: log to console. In production, call an email/sms provider.
    // eslint-disable-next-line no-console
    console.info('[OTP] Sent code for', email, code);

    return { ok: true };
  }

  async function verifyOtp(email: string, code: string) {
    const otps = loadOtps();
    const entry = otps[email];
    if (!entry) return { ok: false, error: 'No OTP found for this email' };
    if (Date.now() > entry.expiresAt) {
      delete otps[email]; saveOtps(otps);
      return { ok: false, error: 'OTP expired' };
    }
    if (entry.code !== code) return { ok: false, error: 'Invalid code' };

    // Verified — complete action
    if (entry.action === 'signup') {
      // create user
      const users = loadUsers();
      const key = Object.keys(users).find((k) => users[k].email === email);
      if (key) { delete otps[email]; saveOtps(otps); return { ok: false, error: 'User already exists' }; }
      const id = `u_${Date.now()}`;
      users[id] = { email, password: entry.password || '', name: entry.name };
      saveUsers(users);
      setUser({ id, email, name: entry.name });
    } else {
      // signin: find user and sign in
      const users = loadUsers();
      const found = Object.entries(users).find(([, v]) => v.email === email);
      if (!found) { delete otps[email]; saveOtps(otps); return { ok: false, error: 'No account for this email' }; }
      const [id, info] = found;
      setUser({ id, email: info.email, name: info.name });
    }

    delete otps[email]; saveOtps(otps);
    return { ok: true };
  }

  function signout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, signup, signin, signout, sendOtp, verifyOtp }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Return a safe fallback when AuthProvider is not present (e.g., using Clerk)
    return {
      user: null,
      signup: async () => ({ ok: false, error: 'Auth disabled' }),
      signin: async () => ({ ok: false, error: 'Auth disabled' }),
      signout: () => {},
      sendOtp: async () => ({ ok: false, error: 'Auth disabled' }),
      verifyOtp: async () => ({ ok: false, error: 'Auth disabled' }),
    } as unknown as AuthContextValue;
  }
  return ctx;
}
