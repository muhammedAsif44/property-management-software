const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  statusCode: number;
  error?: string;

  constructor(message: string, statusCode: number, error?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.error = error;
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
}

class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // Includes HTTP-only cookies
    };

    if (options.body && typeof options.body !== 'string') {
      config.body = JSON.stringify(options.body);
    } else if (options.body) {
      config.body = options.body;
    }

    try {
      const response = await fetch(url, config);
      const text = await response.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        const errorMsg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message || `Request failed with status ${response.status}`;
        throw new ApiError(errorMsg, response.status, data.error);
      }

      return data as T;
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(
        err.message || 'Unable to connect to server. Please check your internet connection.',
        500
      );
    }
  }

  public get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  public patch<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  public delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  public async downloadFile(endpoint: string, filename: string): Promise<void> {
    const separator = endpoint.includes('?') ? '&' : '?';
    const cacheBustedEndpoint = `${endpoint}${separator}_t=${Date.now()}`;
    const url = `${this.baseUrl}${cacheBustedEndpoint.startsWith('/') ? cacheBustedEndpoint : `/${cacheBustedEndpoint}`}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new ApiError(`Download failed with status ${response.status}`, response.status);
      }

      const rawBlob = await response.blob();
      if (rawBlob.size === 0) {
        throw new ApiError('Received empty PDF response from server. Retrying...', 500);
      }

      const pdfBlob = new Blob([rawBlob], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(pdfBlob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
      link.target = '_self';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 10000);
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(err.message || 'Failed to download file.', 500);
    }
  }
}

export const httpClient = new HttpClient(API_BASE_URL);
