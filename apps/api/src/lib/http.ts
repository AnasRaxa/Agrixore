import type { Response } from 'express';
import type { ApiMeta } from '@agrixore/shared';

/** Standard success envelope: { data, meta? } (ARCHITECTURE.md section 8.2). */
export function ok<T>(res: Response, data: T, meta?: ApiMeta): void {
  res.json(meta ? { data, meta } : { data });
}
