// Direct Google OAuth and Prisma REST API Bridge replacing Firebase completely

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  tenantId: string | null;
  providerData: any[];
}

class FirebaseAuth {
  currentUser: User | null = null;
  private _listeners: ((user: User | null) => void)[] = [];

  constructor() {
    // Load existing session if present
    try {
      const saved = localStorage.getItem("linkly-user-session");
      if (saved) {
        const profile = JSON.parse(saved);
        this.currentUser = {
          uid: profile.uid,
          email: profile.email || "",
          displayName: profile.displayName || "",
          photoURL: profile.photoURL || "",
          emailVerified: true,
          isAnonymous: false,
          tenantId: null,
          providerData: []
        };
      }
    } catch (err) {
      console.error("Failed to recover authentication session:", err);
    }
  }

  _setCurrentUser(user: User | null) {
    this.currentUser = user;
    this._listeners.forEach(l => l(user));
  }

  onAuthStateChanged(callback: (user: User | null) => void) {
    this._listeners.push(callback);
    // Instant initial callback trigger
    callback(this.currentUser);
    return () => {
      this._listeners = this._listeners.filter(l => l !== callback);
    };
  }
}

export const auth = new FirebaseAuth();

// Placeholder database reference
export const db = {};

export const googleProvider = {};

export function onAuthStateChanged(authInstance: typeof auth, callback: (user: User | null) => void) {
  return authInstance.onAuthStateChanged(callback);
}

// Open Google Sign-In popup using standard OAuth2 Popup Pattern
export async function signInWithPopup(authInstance: typeof auth, provider: any): Promise<void> {
  // Fetch Google OAuth url from server
  const res = await fetch("/api/auth/google/url");
  if (!res.ok) {
    throw new Error("Gagal mengambil URL autentikasi Google");
  }

  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error(`Expected JSON response but received: ${contentType || "unknown"}`);
  }

  const { url } = await res.json();

  return new Promise((resolve, reject) => {
    const width = 500;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      url,
      "google_oauth_popup",
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
    );

    if (!popup) {
      reject(new Error("Popup blocked: Harap aktifkan pop-up browser untuk masuk menggunakan Google."));
      return;
    }

    const handleMessage = (event: MessageEvent) => {

      if (event.data?.type === "OAUTH_AUTH_SUCCESS" && event.data?.user) {
        const u = event.data.user;
        const profile: User = {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          photoURL: u.photoURL,
          emailVerified: true,
          isAnonymous: false,
          tenantId: null,
          providerData: []
        };

        localStorage.setItem("linkly-user-session", JSON.stringify(profile));
        authInstance._setCurrentUser(profile);

        window.removeEventListener("message", handleMessage);
        resolve();
      }
    };

    window.addEventListener("message", handleMessage);

    // Track popup closure
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", handleMessage);
        resolve(); // Resolve anyway so UI completes loading state
      }
    }, 500);
  });
}

export async function signOut(authInstance: typeof auth): Promise<void> {
  localStorage.removeItem("linkly-user-session");
  authInstance._setCurrentUser(null);
}

export function collection(dbInstance: any, path: string) {
  return { type: "collection", path };
}

export function doc(...args: any[]) {
  if (args[0]?.type === "collection") {
    return { type: "doc", path: args[0].path, id: args[1] };
  }
  if (args.length === 3) {
    return { type: "doc", path: args[1], id: args[2] };
  }
  if (args.length === 2) {
    const parts = args[1].split("/");
    return { type: "doc", path: parts[0], id: parts[1] };
  }
  return { type: "doc", path: "unknown", id: "unknown" };
}

export function query(collectionInstance: any, ...constraints: any[]) {
  return { type: "query", path: collectionInstance.path, constraints };
}

export function where(field: string, operator: string, value: any) {
  return { field, operator, value };
}

export async function getDoc(docRef: any) {
  const res = await fetch(`/api/documents/${docRef.path}/${docRef.id}`);
  const exists = res.status !== 404;
  let payload = null;
  if (exists && res.ok) {
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      payload = await res.json();
    } else {
      console.warn(`getDoc on ${docRef.path}/${docRef.id} returned non-JSON content-type:`, contentType);
    }
  }
  return {
    exists: () => exists && payload !== null,
    data: () => payload
  };
}

export async function getDocFromServer(docRef: any) {
  return getDoc(docRef);
}

export async function setDoc(docRef: any, data: any, options?: any) {
  const res = await fetch(`/api/documents/${docRef.path}/${docRef.id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    throw new Error(`Failed to save document: ${res.statusText}`);
  }
}

export async function updateDoc(docRef: any, data: any) {
  const res = await fetch(`/api/documents/${docRef.path}/${docRef.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    throw new Error(`Failed to update document: ${res.statusText}`);
  }
}

export async function deleteDoc(docRef: any) {
  const res = await fetch(`/api/documents/${docRef.path}/${docRef.id}`, {
    method: "DELETE"
  });
  if (!res.ok) {
    throw new Error(`Failed to delete document: ${res.statusText}`);
  }
}

export async function getDocs(target: any) {
  if (target.type === "collection" || target.type === "query") {
    const queryParams = new URLSearchParams();
    if (target.constraints) {
      for (const c of target.constraints) {
        if (c.field && c.value !== undefined) {
          queryParams.append(c.field, c.value);
        }
      }
    }
    const res = await fetch(`/api/documents/${target.path}?${queryParams}`);
    if (!res.ok) {
      throw new Error(`Fetch failed with status ${res.status}`);
    }
    const docs = await res.json();
    return {
      docs: docs.map((d: any) => ({
        id: d.id,
        data: () => d
      })),
      empty: docs.length === 0
    };
  }
  throw new Error("Invalid target type for getDocs");
}

// Smart reactive poller simulating onSnapshot real-time triggers seamlessly
export function onSnapshot(
  target: any,
  onNext: (snapshot: any) => void,
  onError?: (error: any) => void
) {
  let active = true;
  let intervalId: any = null;

  const fetchData = async () => {
    if (!active) return;
    // Skip fetching if the tab is hidden or backgrounded to conserve resources and network
    if (document.hidden) return;

    try {
      if (target.type === "doc") {
        const res = await fetch(`/api/documents/${target.path}/${target.id}`);
        const exists = res.status !== 404;
        let payload = null;
        if (exists && res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            payload = await res.json();
          } else {
            throw new Error(`Expected JSON response but received: ${contentType || "unknown"}`);
          }
        }
        if (active) {
          onNext({
            exists: () => exists && payload !== null,
            data: () => payload
          });
        }
      } else if (target.type === "collection" || target.type === "query") {
        const queryParams = new URLSearchParams();
        if (target.constraints) {
          for (const c of target.constraints) {
            if (c.field && c.value !== undefined) {
              queryParams.append(c.field, c.value);
            }
          }
        }
        const res = await fetch(`/api/documents/${target.path}?${queryParams}`);
        if (!res.ok) {
          throw new Error(`Fetch failed with status ${res.status}`);
        }
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(`Expected JSON response but received: ${contentType || "unknown"}`);
        }
        const docs = await res.json();
        if (active) {
          onNext({
            docs: docs.map((d: any) => ({
              id: d.id,
              data: () => d
            })),
            empty: docs.length === 0
          });
        }
      }
    } catch (err) {
      if (active && onError) {
        onError(err);
      }
    }
  };

  fetchData();
  
  // Polling interval increased to 30 seconds for optimal performance
  intervalId = setInterval(fetchData, 30000);

  // Trigger immediate fetch when tab returns to focus
  const handleVisibilityChange = () => {
    if (active && !document.hidden) {
      fetchData();
    }
  };
  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    active = false;
    if (intervalId) {
      clearInterval(intervalId);
    }
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}

export class Timestamp {
  seconds: number;
  nanoseconds: number;
  constructor(seconds: number, nanoseconds: number) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }
  static now() {
    const ms = Date.now();
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1000000);
  }
  static fromDate(date: Date) {
    const ms = date.getTime();
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1000000);
  }
  toDate() {
    return new Date(this.seconds * 1000 + this.nanoseconds / 1000000);
  }
  toISOString() {
    return this.toDate().toISOString();
  }
}

export function increment(value: number) {
  return { __increment: value };
}
