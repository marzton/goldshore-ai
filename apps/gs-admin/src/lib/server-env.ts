export function getServerEnv(locals: Record<string, unknown>) {
  return locals.runtime?.env || process.env;
}
