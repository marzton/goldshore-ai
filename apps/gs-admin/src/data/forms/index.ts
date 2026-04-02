export const formConfigs: Record<string, unknown> = {};
export function getFormConfig(slug: string): unknown {
  return formConfigs[slug];
}
export const forms = [];