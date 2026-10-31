import type { IncomingMessage, ServerResponse } from 'http';
import app from '../server';

/**
 * Vercel serverless entry point.
 *
 * All `/api/*` requests are rewritten to this function (see vercel.json) and
 * are handled by the shared Express app. The Express app is reused across
 * invocations of the same warm lambda instance.
 */
const handler = (req: IncomingMessage, res: ServerResponse): void => {
  (app as unknown as (request: IncomingMessage, response: ServerResponse) => void)(req, res);
};

export default handler;
