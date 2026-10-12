import { AppError } from '../../lib/errors';

export const unauthorized = (message = 'Please sign in.') => new AppError(401, 'UNAUTHORIZED', message);
export const forbidden = (message = 'This action is not allowed.') => new AppError(403, 'FORBIDDEN', message);
export const notFoundError = (message: string) => new AppError(404, 'NOT_FOUND', message);
export const validationFailed = (details: Array<{ path: string; message: string }>) => new AppError(400, 'VALIDATION_ERROR', 'Invalid request', details);
