export function getServerEnv(
  locals: App.Locals
): App.Locals['runtime']['env'] | NodeJS.ProcessEnv {
  return locals.runtime?.env || process.env;
}
