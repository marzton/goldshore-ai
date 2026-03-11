import piiScanReport from '../data/pii-scan-results.json';

interface PiiSummary {
  high?: number;
  medium?: number;
  low?: number;
  totalFindings?: number;
}

interface PiiReport {
  generatedAt?: string;
  summary?: PiiSummary;
}

export interface DeploymentGuardState {
  isLocked: boolean;
  reason: string;
  highSeverityCount: number;
  generatedAt: string | null;
}

const HIGH_SEVERITY_THRESHOLD = 1;

export function getDeploymentGuardState(report: PiiReport = piiScanReport): DeploymentGuardState {
  const highSeverityCount = Number(report?.summary?.high ?? 0);
  const isLocked = highSeverityCount >= HIGH_SEVERITY_THRESHOLD;

  return {
    isLocked,
    reason: isLocked
      ? `Build locked: ${highSeverityCount} high-severity security finding${highSeverityCount === 1 ? '' : 's'} detected.`
      : 'Build unlocked: no high-severity security findings detected.',
    highSeverityCount,
    generatedAt: report?.generatedAt ?? null
  };
}
