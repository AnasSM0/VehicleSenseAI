const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5000";

// Simple fetch wrapper to replace Supabase client
export const supabase = {
  from: (table: string) => ({
    select: async (columns = "*") => {
      const response = await fetch(`${API_BASE_URL}/api/${table}`);
      const data = await response.json();
      return { data, error: null };
    },
    insert: async (values: any) => {
      const response = await fetch(`${API_BASE_URL}/api/${table}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      return { data, error: null };
    },
    update: async (values: any) => ({
      eq: async (column: string, value: any) => {
        const response = await fetch(`${API_BASE_URL}/api/${table}/${value}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const data = await response.json();
        return { data, error: null };
      },
    }),
    delete: async () => ({
      eq: async (column: string, value: any) => {
        const response = await fetch(`${API_BASE_URL}/api/${table}/${value}`, {
          method: "DELETE",
        });
        const data = await response.json();
        return { data, error: null };
      },
    }),
  }),
  auth: {
    signInWithPassword: async (credentials: any) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      return { data: { session: data.session || null }, error: null };
    },
    signUp: async (credentials: any) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      return { data: { user: data.user || null }, error: null };
    },
    signOut: async () => {
      await fetch(`${API_BASE_URL}/api/auth/logout`, { method: "POST" });
      return { error: null };
    },
    getSession: async () => {
      const session = localStorage.getItem("session");
      return { data: { session: session ? JSON.parse(session) : null }, error: null };
    },
    onAuthStateChange: (callback: any) => {
      // Mock implementation
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
  },
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch(`${API_BASE_URL}/api/upload`, {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        return { data: { path: data.path }, error: null };
      },
    }),
  },
};