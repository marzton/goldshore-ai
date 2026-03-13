import { performance } from "node:perf_hooks";

// Mocks
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function getPagesProjectBuildStatus(_project: string) {
  await delay(100);
  return "success";
}

async function getDNSRecords() {
  await delay(100);
  return [];
}

async function getWorkerBindings(_script: string) {
  await delay(100);
  return ["binding1"];
}

async function openOpsIssue() {
  await delay(100);
}

// Config mock
type CloudflareCheck =
  | { type: "pages_build_status"; project: string }
  | { type: "dns_records" }
  | { type: "worker_health"; script: string };

const cfg: {
  cloudflare: {
    checks: CloudflareCheck[];
  };
  github: { org: string };
  ai_agent: { triage_labels: string[] };
} = {
  cloudflare: {
    checks: Array.from({ length: 20 }, () => ({
      type: "pages_build_status",
      project: "gs-web",
    })),
  },
  github: { org: "goldshore" },
  ai_agent: { triage_labels: [] },
};

// Original sequential function
async function checkCloudflareSequential() {
  for (const check of cfg.cloudflare.checks) {
    if (check.type === "pages_build_status") {
      const status = await getPagesProjectBuildStatus(check.project);
      if (!["success", "completed"].includes(status)) {
        await openOpsIssue();
      }
    } else if (check.type === "dns_records") {
      await getDNSRecords();
      // Mock logic
    } else if (check.type === "worker_health") {
      await getWorkerBindings(check.script);
      // Mock logic
    }
  }
}

async function checkCloudflareConcurrent() {
  const maxConcurrent = 6;
  const checks: CloudflareCheck[] = cfg.cloudflare.checks;
  const executing = new Set<Promise<void>>();

  for (const check of checks) {
    const p = Promise.resolve().then(async () => {
      try {
        if (check.type === "pages_build_status") {
          const status = await getPagesProjectBuildStatus(check.project);
          if (!["success", "completed"].includes(status)) {
            await openOpsIssue();
          }
        } else if (check.type === "dns_records") {
          await getDNSRecords();
          // Mock logic
        } else if (check.type === "worker_health") {
          await getWorkerBindings(check.script);
          // Mock logic
        }
      } catch (err: unknown) {
        console.error(`Error processing check ${check.type}:`, err);
      }
    });

    const tracked = p.finally(() => {
      executing.delete(tracked);
    });

    executing.add(tracked);

    if (executing.size >= maxConcurrent) {
      await Promise.race(executing);
    }
  }

  // Wait for the remaining checks to complete
  await Promise.all(executing);
}

async function runBenchmark() {
  console.log("Starting Sequential Benchmark...");
  const startSeq = performance.now();
  await checkCloudflareSequential();
  const endSeq = performance.now();
  const seqTime = endSeq - startSeq;
  console.log(`Sequential execution took: ${seqTime.toFixed(2)}ms`);

  console.log("Starting Concurrent Benchmark...");
  const startConc = performance.now();
  await checkCloudflareConcurrent();
  const endConc = performance.now();
  const concTime = endConc - startConc;
  console.log(`Concurrent execution took: ${concTime.toFixed(2)}ms`);

  console.log(`Speed improvement: ${(seqTime / concTime).toFixed(2)}x faster`);
}

runBenchmark().catch(console.error);
