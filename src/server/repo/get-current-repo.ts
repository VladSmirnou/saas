import type { Repo } from './types/repo';

const repoType = process.env.REPOSITORY;

if (!repoType) {
  throw new Error('repository type is not set');
}

const { repo } = (await import(`./${repoType}/repo.ts`)) as { repo: Repo };
export { repo };
