import type { Job, QueuesAdapter } from '../adapter.contract.ts';

export class LocalQueuesAdapter<T> implements QueuesAdapter<T> {
  private jobs: Job<T>[] = [];
  private handler?: (job: Job<T>) => Promise<unknown>;

  async enqueue(jobs: Job<T>[]): Promise<void> {
    this.jobs.push(...jobs);
    if (this.handler) {
      await this.drain();
    }
  }

  async consume(handler: (job: Job<T>) => Promise<unknown>): Promise<void> {
    this.handler = handler;
    await this.drain();
  }

  private async drain(): Promise<void> {
    if (!this.handler) return;
    while (this.jobs.length > 0) {
      const job = this.jobs.shift();
      if (job) await this.handler(job);
    }
  }
}
