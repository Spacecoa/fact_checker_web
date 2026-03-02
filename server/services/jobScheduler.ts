import { collectAndStoreNews } from "./newsCollector";
import { verifyAllUnverifiedReports } from "./verificationService";
import { sendNotificationsForNewReports } from "./telegramBot";

interface ScheduledJob {
  name: string;
  interval: number; // in milliseconds
  lastRun: number;
  enabled: boolean;
}

const jobs: Map<string, ScheduledJob> = new Map();

/**
 * Initialize job scheduler
 */
export function initializeJobScheduler() {
  console.log("[JobScheduler] Initializing job scheduler...");

  // News collection job - runs every 4 hours
  registerJob("collectNews", 4 * 60 * 60 * 1000, async () => {
    console.log("[JobScheduler] Starting news collection job...");
    try {
      const count = await collectAndStoreNews();
      console.log(`[JobScheduler] News collection completed. Added ${count} items.`);
    } catch (error) {
      console.error("[JobScheduler] News collection job failed:", error);
    }
  });

  // Verification job - runs every 2 hours
  registerJob("verifyReports", 2 * 60 * 60 * 1000, async () => {
    console.log("[JobScheduler] Starting verification job...");
    try {
      const count = await verifyAllUnverifiedReports();
      console.log(`[JobScheduler] Verification completed. Verified ${count} reports.`);
    } catch (error) {
      console.error("[JobScheduler] Verification job failed:", error);
    }
  });

  // Notification job - runs every 30 minutes
  registerJob("sendNotifications", 30 * 60 * 1000, async () => {
    console.log("[JobScheduler] Starting notification job...");
    try {
      const count = await sendNotificationsForNewReports();
      console.log(`[JobScheduler] Notifications sent. Count: ${count}.`);
    } catch (error) {
      console.error("[JobScheduler] Notification job failed:", error);
    }
  });

  // Start the scheduler
  startScheduler();
}

/**
 * Register a new job
 */
function registerJob(
  name: string,
  interval: number,
  handler: () => Promise<void>
) {
  jobs.set(name, {
    name,
    interval,
    lastRun: 0,
    enabled: true,
  });

  console.log(
    `[JobScheduler] Registered job: ${name} (interval: ${interval / 1000 / 60} minutes)`
  );
}

/**
 * Start the scheduler loop
 */
function startScheduler() {
  console.log("[JobScheduler] Starting scheduler loop...");

  setInterval(() => {
    const now = Date.now();

    const jobEntries = Array.from(jobs.entries());
  for (const [name, job] of jobEntries) {
      if (!job.enabled) continue;

      if (now - job.lastRun >= job.interval) {
        console.log(`[JobScheduler] Executing job: ${name}`);
        job.lastRun = now;

        // Execute job without blocking
        executeJob(name).catch((error) => {
          console.error(`[JobScheduler] Job ${name} failed:`, error);
        });
      }
    }
  }, 60 * 1000); // Check every minute
}

/**
 * Execute a specific job
 */
async function executeJob(name: string): Promise<void> {
  switch (name) {
    case "collectNews":
      await collectAndStoreNews();
      break;
    case "verifyReports":
      await verifyAllUnverifiedReports();
      break;
    case "sendNotifications":
      await sendNotificationsForNewReports();
      break;
    default:
      console.warn(`[JobScheduler] Unknown job: ${name}`);
  }
}

/**
 * Get job status
 */
export function getJobStatus(): Record<string, any> {
  const status: Record<string, any> = {};

  const jobEntries = Array.from(jobs.entries());
  for (const [name, job] of jobEntries) {
    status[name] = {
      enabled: job.enabled,
      interval: job.interval,
      lastRun: new Date(job.lastRun),
      nextRun: new Date(job.lastRun + job.interval),
    };
  }

  return status;
}

/**
 * Enable/disable a job
 */
export function setJobEnabled(name: string, enabled: boolean): boolean {
  const job = jobs.get(name);
  if (!job) return false;

  job.enabled = enabled;
  console.log(`[JobScheduler] Job ${name} ${enabled ? "enabled" : "disabled"}`);
  return true;
}

/**
 * Manually trigger a job
 */
export async function triggerJob(name: string): Promise<boolean> {
  const job = jobs.get(name);
  if (!job) return false;

  console.log(`[JobScheduler] Manually triggering job: ${name}`);
  job.lastRun = Date.now();

  try {
    await executeJob(name);
    return true;
  } catch (error) {
    console.error(`[JobScheduler] Manual job trigger failed:`, error);
    return false;
  }
}
