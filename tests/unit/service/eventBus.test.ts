import { describe, expect, it, vi } from 'vitest';
import { eventBus } from '@/server/lib/eventBus';

describe('eventBus', () => {
  it('subscribe and publish', () => {
    const handler = vi.fn();
    const unsub = eventBus.subscribe('test-event', handler);
    eventBus.publish('test-event', { hello: 'world' });
    expect(handler).toHaveBeenCalledWith({ hello: 'world' });
    unsub();
  });

  it('unsubscribe stops receiving events', () => {
    const handler = vi.fn();
    const unsub = eventBus.subscribe('test-unsub', handler);
    unsub();
    eventBus.publish('test-unsub', {});
    expect(handler).not.toHaveBeenCalled();
  });

  it('multiple listeners receive same event', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    const u1 = eventBus.subscribe('multi', h1);
    const u2 = eventBus.subscribe('multi', h2);
    eventBus.publish('multi', { value: 42 });
    expect(h1).toHaveBeenCalledWith({ value: 42 });
    expect(h2).toHaveBeenCalledWith({ value: 42 });
    u1();
    u2();
  });

  it('does not throw when listener throws', () => {
    const badHandler = vi.fn().mockImplementation(() => {
      throw new Error('listener error');
    });
    const unsub = eventBus.subscribe('throw-test', badHandler);
    expect(() => eventBus.publish('throw-test', {})).not.toThrow();
    unsub();
  });
});
