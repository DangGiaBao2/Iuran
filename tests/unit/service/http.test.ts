import { describe, expect, it } from 'vitest';
import { AppError, fail, fromError, ok } from '@/server/lib/http';

describe('http helpers', () => {
  it('ok() returns 200 with data envelope', async () => {
    const res = ok({ foo: 'bar' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.foo).toBe('bar');
  });

  it('ok() with custom init sets status', async () => {
    const res = ok({ id: 1 }, { status: 201 });
    expect(res.status).toBe(201);
  });

  it('fail() returns error envelope', async () => {
    const res = fail('NOT_FOUND', 'Resource not found', 404);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('fromError() handles AppError', async () => {
    const err = new AppError('CONFLICT', 'Already exists', 409);
    const res = fromError(err);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe('CONFLICT');
  });

  it('fromError() handles ZodError', async () => {
    const zodLike = {
      name: 'ZodError',
      issues: [{ path: ['amount'], message: 'Invalid input' }],
    };
    const res = fromError(zodLike);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('INVALID_INPUT');
  });

  it('fromError() handles unknown error', async () => {
    const res = fromError(new Error('boom'));
    expect(res.status).toBe(500);
  });

  it('AppError has correct .status property', () => {
    const err = new AppError('INTERNAL', 'oops', 500);
    expect(err.status).toBe(500);
    expect(err.code).toBe('INTERNAL');
  });
});
