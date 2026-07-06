import type { R2Adapter, R2Object } from '../adapter.contract.ts';

export class LocalR2Adapter implements R2Adapter {
  private store = new Map<string, R2Object>();

  async put(object: R2Object): Promise<void> {
    this.store.set(object.key, object);
  }

  async get(key: string): Promise<R2Object | null> {
    return this.store.get(key) ?? null;
  }

  async list(prefix: string): Promise<string[]> {
    return Array.from(this.store.keys()).filter((key) => key.startsWith(prefix));
  }
}
