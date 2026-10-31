import type { IncomingMessage, ServerResponse } from 'http';
import app from '../server';

/**
 * Vercel serverless entry point.
 *
 * All `/api/*` requests are rewritten to this function (see vercel.json). The
 * rewrite captures the original API path in `__original_path` so Express always
 * receives the path it was written for (`/api/customers`, `/api/health`, ...)
 * regardless of how the platform forwards rewritten URLs.
 */
const handler = (req: IncomingMessage, res: ServerResponse): void => {
  try {
    const parsed = new URL(req.url || '/', 'http://localhost');
    const capturedPath = parsed.searchParams.get('__original_path');
    if (capturedPath !== null) {
      parsed.searchParams.delete('__original_path');
      const suffix = capturedPath.replace(/^\/+/, '');
      const query = parsed.searchParams.toString();
      req.url = `/api${suffix ? `/${suffix}` : ''}${query ? `?${query}` : ''}`;
    }
  } catch {
    // Fall back to the URL provided by the platform.
  }

  (app as unknown as (request: IncomingMessage, response: ServerResponse) => void)(req, res);
};

export default handler;
