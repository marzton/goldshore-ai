export function getServerEnv(
  locals: Pick<App.Locals, 'runtime'>
): App.Locals['runtime']['env'] | NodeJS.ProcessEnv {
  return locals.runtime?.env || process.env;
}
