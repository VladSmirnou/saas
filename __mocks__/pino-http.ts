import type { NextFunction, Request, Response } from 'express';
import type { Options } from 'pino-http';

const mockLogError = vi.fn();
const mockLogInfo = vi.fn();

const original = await vi.importActual<typeof import('pino-http')>('pino-http');

const middlewareFn = (opts: Options) => {
  const middleware = original.default(opts);

  return (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, () => {
      req.log = req.log || {};
      req.log.error = mockLogError;
      req.log.info = mockLogInfo;
      next();
    });
  };
};

export { mockLogError, mockLogInfo, middlewareFn as default };
