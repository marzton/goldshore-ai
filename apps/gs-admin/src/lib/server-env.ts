export function getServerEnv(
  locals: Partial<Pick<App.Locals, 'runtime'>>
): App.Locals['runtime']['env'] | NodeJS.ProcessEnv {
  return locals.runtime?.env || process.env;
}
