import { JobQueue } from './JobQueue';
import { JobExecutor } from './JobExecutor';
import type { QueuedJob } from './JobQueue';

export class JobScheduler {
  private jobQueue: JobQueue;
  private jobExecutor: JobExecutor;
  private isRunning = false;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(processingIntervalMs = 5000) {
    this.jobQueue = new JobQueue(processingIntervalMs);
    this.jobExecutor = new JobExecutor();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[JobScheduler] Already running');
      return;
    }

    console.log('[JobScheduler] Starting job scheduler');
    this.isRunning = true;

    // Start the job queue
    await this.jobQueue.start();

    // Start the main processing loop
    this.startProcessingLoop();

    // Start periodic cleanup
    this.startCleanupTask();

    console.log('[JobScheduler] Job scheduler started successfully');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('[JobScheduler] Stopping job scheduler');
    this.isRunning = false;

    // Stop the job queue
    await this.jobQueue.stop();

    // Stop cleanup task
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    console.log('[JobScheduler] Job scheduler stopped');
  }

  private startProcessingLoop(): void {
    const processJobs = async () => {
      if (!this.isRunning) {
        return;
      }

      try {
        const jobs = await this.jobQueue.getReadyJobs(10);
        
        if (jobs.length > 0) {
          console.log(`[JobScheduler] Processing ${jobs.length} jobs`);
          await this.processBatch(jobs);
        }
      } catch (error) {
        console.error('[JobScheduler] Error in processing loop:', error);
      }

      // Schedule next processing cycle
      if (this.isRunning) {
        setTimeout(processJobs, 2000); // Process every 2 seconds
      }
    };

    // Start processing
    setTimeout(processJobs, 1000); // Initial delay
  }

  private async processBatch(jobs: QueuedJob[]): Promise<void> {
    // Process jobs in parallel with limited concurrency
    const concurrency = 3;
    const chunks = this.chunkArray(jobs, concurrency);

    for (const chunk of chunks) {
      const promises = chunk.map(job => this.processJob(job));
      await Promise.allSettled(promises);
    }
  }

  private async processJob(job: QueuedJob): Promise<void> {
    try {
      console.log(`[JobScheduler] Processing job ${job.id} (${job.kind})`);
      
      // Mark job as running
      await this.jobQueue.markJobRunning(job.id);
      
      // Execute the job
      await this.jobExecutor.executeJob(job);
      
      // Mark job as completed
      await this.jobQueue.markJobCompleted(job.id);
      
      console.log(`[JobScheduler] Job ${job.id} completed successfully`);
    } catch (error) {
      console.error(`[JobScheduler] Job ${job.id} failed:`, error);
      
      // Handle job failure
      await this.jobExecutor.handleJobFailure(job, error instanceof Error ? error : new Error(String(error)));
      
      // Mark job as failed (will handle retry logic)
      await this.jobQueue.markJobFailed(job.id, error instanceof Error ? error.message : String(error));
    }
  }

  private startCleanupTask(): void {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(async () => {
      try {
        const purgedCount = await this.jobQueue.purgeCompletedJobs(24); // 24 hours
        if (purgedCount > 0) {
          console.log(`[JobScheduler] Cleanup: purged ${purgedCount} old completed jobs`);
        }
      } catch (error) {
        console.error('[JobScheduler] Error in cleanup task:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async scheduleJob(jobData: {
    tenantId: string;
    processId: string;
    taskId?: string;
    kind: 'service_exec' | 'timer' | 'retry';
    runAt?: Date;
    payloadJson?: any;
    idempotencyKey?: string;
    maxAttempts?: number;
  }): Promise<void> {
    console.log(`[JobScheduler] Scheduling ${jobData.kind} job for process ${jobData.processId}`);
    
    await this.jobQueue.enqueue({
      tenant_id: jobData.tenantId,
      process_id: jobData.processId,
      task_id: jobData.taskId || null,
      kind: jobData.kind,
      run_at: jobData.runAt || new Date(),
      max_attempts: jobData.maxAttempts || 3,
      payload_json: jobData.payloadJson || {},
      idempotency_key: jobData.idempotencyKey || null,
    });
  }

  async getSchedulerStats(): Promise<{
    isRunning: boolean;
    queueStats: {
      queued: number;
      running: number;
      completed: number;
      failed: number;
    };
    executorStats: {
      totalExecuted: number;
      successRate: number;
      averageExecutionTime: number;
    };
  }> {
    const queueStats = await this.jobQueue.getQueueStats();
    const executorStats = await this.jobExecutor.getJobExecutionStats();

    return {
      isRunning: this.isRunning,
      queueStats,
      executorStats,
    };
  }

  async pauseProcessing(): Promise<void> {
    console.log('[JobScheduler] Pausing job processing');
    await this.jobQueue.stop();
  }

  async resumeProcessing(): Promise<void> {
    console.log('[JobScheduler] Resuming job processing');
    await this.jobQueue.start();
  }
}