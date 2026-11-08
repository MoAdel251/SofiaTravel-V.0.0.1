import type { IncomingMessage, ServerResponse } from 'http';

type ExpressApp = (request: IncomingMessage, response: ServerResponse) => void;

/**
 * Vercel serverless entry point.
 *
 * All `/api/*` requests are rewritten to this function (see vercel.json). The
 * rewrite captures the original API path in `__original_path` so Express always
 * receives the path it was written for (`/api/customers`, `/api/health`, ...)
 * regardless of how the platform forwards rewritten URLs.
 *
 * The Express app is imported lazily so an initialization failure returns a
 * readable error instead of killing the whole invocation with an opaque
 * FUNCTION_INVOCATION_FAILED response.
 */
let appPromise: Promise<ExpressApp> | null = null;

function unwrapServerModule(mod: unknown): ExpressApp {
  let candidate = (mod as { default?: unknown })?.default ?? mod;
  // Dynamic import of a CommonJS bundle exposes module.exports as `default`.
  if (
    candidate &&
    typeof candidate !== 'function' &&
    typeof (candidate as { default?: unknown }).default === 'function'
  ) {
    candidate = (candidate as { default: unknown }).default;
  }
  if (typeof candidate !== 'function') {
    throw new Error('Server module did not export a callable Express app');
  }
  return candidate as ExpressApp;
}

function loadApp(): Promise<ExpressApp> {
  if (!appPromise) {
    appPromise = import('../api-dist/app.cjs').then(unwrapServerModule);
  }
  return appPromise;
}

const handler = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
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

  try {
    const app = await loadApp();
    app(req, res);
  } catch (err) {
    console.error('[api] initialization failed:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: 'Server initialization failed',
          detail: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
        })
      );
    } else {
      res.end();
    }
  }
};

export default handler;
