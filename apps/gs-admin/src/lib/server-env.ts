export function getServerEnv(locals: any): Record<string, string | undefined> {
  return locals.runtime?.env || process.env;
}
