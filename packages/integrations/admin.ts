import type { AuthTokenConfig } from './auth';
import { createAuthTokenManager } from './auth';
import { createAuditLogger } from './audit';
import { createHttpClient } from './http';

export type AdminServiceConfig = {
  apiBaseUrl: string;
  auth?: AuthTokenConfig;
  auditEndpoint?: string;
  actor?: string;
};

export const createAdminService = (config: AdminServiceConfig) => {
  const authTokenManager = config.auth ? createAuthTokenManager(config.auth) : undefined;
  const httpClient = createHttpClient({
    baseUrl: config.apiBaseUrl,
    authTokenManager
  });
  const auditLogger = createAuditLogger({
    endpoint: config.auditEndpoint,
    httpClient
  });

  const getSystemInfo = async () => {
    let status: 'success' | 'failure' = 'success';
    try {
      const response = await httpClient.get('/system/info', { cache: 'no-store' });
      if (!response.ok) {
        status = 'failure';
        return null;
      }
      return await response.json();
    } catch (error) {
      status = 'failure';
      return null;
    } finally {
      await auditLogger.logAdminAction({
        action: 'system.info.read',
        actor: config.actor,
        target: 'system',
        status
      });
    }
  };

  return {
    getSystemInfo
  };
};
