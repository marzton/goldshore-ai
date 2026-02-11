export type AdminServerEnv = {
  GS_API_URL?: string;
  ADMIN_GS_API_ROLES?: string;
  CLOUDFLARE_ACCESS_AUDIENCE?: string;
  CLOUDFLARE_TEAM_DOMAIN?: string;
  PUBLIC_API?: string;
};

type RuntimeEnvContainer = {
  runtime?: {
    env?: Record<string, string | undefined>;
  };
};

export const getServerEnv = (locals?: RuntimeEnvContainer) => {
  const runtimeEnv = locals?.runtime?.env ?? {};
  return {
    ...import.meta.env,
    ...runtimeEnv
  } as AdminServerEnv;
};
