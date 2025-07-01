import { router } from './trpc.js';
import { authRouter } from './auth.js';
import { assetsRouter } from './assets.js';
import { casesRouter } from './cases.js';
import { documentsRouter } from './documents.js';
import { evidenceRouter } from './evidence.js';
import { monitoringRouter } from './monitoring.js';
import { userRolesRouter } from './userRoles.js';

export const appRouter = router({
  auth: authRouter,
  assets: assetsRouter,
  cases: casesRouter,
  documents: documentsRouter,
  evidence: evidenceRouter,
  monitoring: monitoringRouter,
  userRoles: userRolesRouter,
});