// Simple in-process event bus for SSE streaming
type EventListener = (data: unknown) => void;

class EventBus {
  private listeners = new Map<string, Set<EventListener>>();

  subscribe(event: string, listener: EventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  publish(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((listener) => {
      try {
        listener(data);
      } catch {
        // ignore listener errors
      }
    });
  }
}

// Global singleton — persists across HMR in dev
declare global {
  // eslint-disable-next-line no-var
  var __eventBus: EventBus | undefined;
}

export const eventBus = globalThis.__eventBus ?? new EventBus();
globalThis.__eventBus = eventBus;
