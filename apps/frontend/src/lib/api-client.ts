const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

interface ApiResponse<T> {
  data: T;
  status: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('auth-storage');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return parsed?.state?.accessToken || null;
    } catch {
      return null;
    }
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('auth-storage');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return parsed?.state?.refreshToken || null;
    } catch {
      return null;
    }
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return null;

      const data = await res.json();

      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('auth-storage');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.state.accessToken = data.accessToken;
          parsed.state.refreshToken = data.refreshToken;
          localStorage.setItem('auth-storage', JSON.stringify(parsed));
        }
      }

      return data.accessToken;
    } catch {
      return null;
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    config?: RequestConfig,
    retry = true,
  ): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (config?.params) {
      Object.entries(config.params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config?.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let res: Response;

    try {
      res = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new Error(
        `Nao foi possivel conectar ao backend (${this.baseUrl}${path}). Verifique se a API esta no ar e se NEXT_PUBLIC_API_URL aponta para o endereco correto.`,
      );
    }

    if (res.status === 401 && retry) {
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        return this.request<T>(method, path, body, config, false);
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return { data, status: res.status };
  }

  get<T>(path: string, config?: RequestConfig) {
    return this.request<T>('GET', path, undefined, config);
  }

  post<T>(path: string, body?: unknown, config?: RequestConfig) {
    return this.request<T>('POST', path, body, config);
  }

  patch<T>(path: string, body?: unknown, config?: RequestConfig) {
    return this.request<T>('PATCH', path, body, config);
  }

  put<T>(path: string, body?: unknown, config?: RequestConfig) {
    return this.request<T>('PUT', path, body, config);
  }

  delete<T>(path: string, config?: RequestConfig) {
    return this.request<T>('DELETE', path, undefined, config);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
