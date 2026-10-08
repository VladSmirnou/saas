import type { Repo } from './types/repo';
import path from 'path';
import { fileURLToPath } from 'url';

const repoType = process.env.REPOSITORY!;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoPath = path.join(__dirname, repoType, 'repo.ts');

const { repo } = (await import(repoPath)) as { repo: Repo };
export { repo };
