const CREDENTIALS_KEY = "cc072_login_credentials";
const AUTH_KEY = "cc072_authenticated";

type Credentials = { username: string; password: string };

const DEFAULT_CREDENTIALS: Credentials = { username: "admin", password: "admin01" };

function readCredentials(): Credentials {
  if (typeof window === "undefined") return DEFAULT_CREDENTIALS;
  try {
    const saved = JSON.parse(
      localStorage.getItem(CREDENTIALS_KEY) ?? "null",
    ) as Partial<Credentials> | null;
    return saved?.username && saved.password
      ? { username: saved.username, password: saved.password }
      : DEFAULT_CREDENTIALS;
  } catch {
    return DEFAULT_CREDENTIALS;
  }
}

export function isAuthenticated() {
  return typeof window !== "undefined" && sessionStorage.getItem(AUTH_KEY) === "true";
}

export function login(username: string, password: string) {
  const valid =
    username.trim() === readCredentials().username && password === readCredentials().password;
  if (valid) sessionStorage.setItem(AUTH_KEY, "true");
  return valid;
}

export function logout() {
  sessionStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new Event("cc072-auth-change"));
}

export function resetCredentials(currentPassword: string, newPassword: string) {
  const credentials = readCredentials();
  if (currentPassword !== credentials.password || !newPassword.trim()) return false;
  localStorage.setItem(
    CREDENTIALS_KEY,
    JSON.stringify({ username: credentials.username, password: newPassword }),
  );
  return true;
}
