export interface ActingContext {
  username: string;
  role: string;
  isIT?: boolean;
}

export class HrApiError extends Error {
  code?: string;
  status: number;
  details: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'HrApiError';
    this.status = status;
    this.details = details;
    this.code = details?.code;
  }
}

function actingHeaders(acting: ActingContext): Record<string, string> {
  return {
    'x-acting-user': acting.isIT ? 'IT' : acting.username || '',
    'x-acting-role': acting.role || '',
  };
}

export async function hrFetch<T = any>(
  path: string,
  acting: ActingContext,
  options: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: any } = {}
): Promise<T> {
  const method = options.method || 'GET';
  const headers: Record<string, string> = {
    ...actingHeaders(acting),
    Accept: 'application/json',
  };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(path, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });

  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message = typeof data === 'object' && data
      ? (data.error || data.message || `Request failed (${response.status})`)
      : `Request failed (${response.status})`;
    throw new HrApiError(String(message), response.status, data);
  }
  return data as T;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read the selected file.'));
    reader.readAsDataURL(file);
  });
}

export function toDateInputValue(value?: string | null): string {
  if (!value) return '';
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
