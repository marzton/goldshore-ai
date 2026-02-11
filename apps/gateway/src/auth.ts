import { verifyAccess } from '@goldshore/auth';

// TODO: Implement auth verification
export async function checkAuth(req: Request, env: any) {
  return verifyAccess(req, env);
}
