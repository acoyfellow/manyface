import type { ContainerResult, ContainerSpec, ContainersAdapter } from '../adapter.contract.ts';

// Registry of named, pure functions that simulate isolated candidate cells.
// In a deployed cell this adapter would call a sandbox or Worker Loader.
export type CellFunction = (input: unknown) => unknown;

export class LocalContainersAdapter implements ContainersAdapter {
  constructor(private readonly registry: Map<string, CellFunction>) {}

  async execute(spec: ContainerSpec): Promise<ContainerResult> {
    const fn = this.registry.get(spec.codeRef);
    const start = performance.now();
    if (!fn) {
      return {
        artifactId: spec.artifactId,
        outputs: [],
        error: `Unknown cell ${spec.codeRef}`,
        wallMs: performance.now() - start,
      };
    }
    try {
      const outputs = spec.inputs.map((input) => fn(input));
      return {
        artifactId: spec.artifactId,
        outputs,
        wallMs: performance.now() - start,
      };
    } catch (error) {
      return {
        artifactId: spec.artifactId,
        outputs: [],
        error: error instanceof Error ? error.message : String(error),
        wallMs: performance.now() - start,
      };
    }
  }
}
