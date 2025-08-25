import { eq, and, or, lte } from 'drizzle-orm';
import { db } from '../../db';
import { engineJobs, type EngineJob } from '@shared/schema';

export interface QueuedJob extends EngineJob {
  retryCount?: number;
}

export class JobQueue {
  private processingInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(private processingIntervalMs = 5000) {}

  async start(): Promise<void> {
    if (this.processingInterval) {
      console.log('[JobQueue] Already running');
      return;
    }

    console.log('[JobQueue] Starting job queue processing');
    this.processingInterval = setInterval(
      () => this.processJobs(),
      this.processingIntervalMs
    );
  }

  async stop(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('[JobQueue] Stopped job queue processing');
    }
  }

  async enqueue(job: Omit<EngineJob, 'id' | 'created_at' | 'attempts' | 'status'>): Promise<void> {
    console.log(`[JobQueue] Enqueuing job: ${job.kind} for process ${job.process_id}`);
    
    await db.insert(engineJobs).values({
      tenant_id: job.tenant_id,
      process_id: job.process_id,
      task_id: job.task_id,
      kind: job.kind,
      run_at: job.run_at,
      max_attempts: job.max_attempts,
      payload_json: job.payload_json,
      idempotency_key: job.idempotency_key,
    });
  }

  async getReadyJobs(limit = 10): Promise<QueuedJob[]> {
    const now = new Date();
    
    return await db
      .select()
      .from(engineJobs)
      .where(and(
        eq(engineJobs.status, 'queued'),
        lte(engineJobs.run_at, now),
        or(
          lte(engineJobs.attempts, engineJobs.max_attempts),
          eq(engineJobs.max_attempts, 0) // Allow infinite retries if max_attempts is 0
        )
      ))
      .orderBy(engineJobs.run_at)
      .limit(limit);
  }

  async markJobRunning(jobId: string): Promise<void> {
    const currentJob = await this.getJobById(jobId);
    await db
      .update(engineJobs)
      .set({ 
        status: 'running',
        attempts: (currentJob?.attempts || 0) + 1
      })
      .where(eq(engineJobs.id, jobId));
  }

  async markJobCompleted(jobId: string): Promise<void> {
    console.log(`[JobQueue] Marking job ${jobId} as completed`);
    
    await db
      .update(engineJobs)
      .set({ status: 'done' })
      .where(eq(engineJobs.id, jobId));
  }

  async markJobFailed(jobId: string, error?: string): Promise<void> {
    console.log(`[JobQueue] Marking job ${jobId} as failed:`, error);
    
    const job = await this.getJobById(jobId);
    if (!job) return;

    // If we haven't exceeded max attempts, reschedule for retry
    if (job.attempts < job.max_attempts) {
      const retryDelay = Math.min(Math.pow(2, job.attempts) * 1000, 300000); // Max 5 minutes
      const nextRunAt = new Date(Date.now() + retryDelay);
      
      console.log(`[JobQueue] Scheduling retry ${job.attempts + 1}/${job.max_attempts} for job ${jobId} at ${nextRunAt.toISOString()}`);
      
      await db
        .update(engineJobs)
        .set({ 
          status: 'queued',
          run_at: nextRunAt,
          payload_json: {
            ...(job.payload_json as Record<string, any> || {}),
            lastError: error || 'Unknown error',
            retryCount: job.attempts
          }
        })
        .where(eq(engineJobs.id, jobId));
    } else {
      // Max attempts reached, mark as dead
      console.log(`[JobQueue] Max attempts reached for job ${jobId}, marking as dead`);
      
      await db
        .update(engineJobs)
        .set({ status: 'dead' })
        .where(eq(engineJobs.id, jobId));
    }
  }

  async getJobById(jobId: string): Promise<EngineJob | null> {
    const [job] = await db
      .select()
      .from(engineJobs)
      .where(eq(engineJobs.id, jobId));
    
    return job || null;
  }

  async getJobsByProcess(processId: string, tenantId: string): Promise<EngineJob[]> {
    return await db
      .select()
      .from(engineJobs)
      .where(and(
        eq(engineJobs.process_id, processId),
        eq(engineJobs.tenant_id, tenantId)
      ))
      .orderBy(engineJobs.created_at);
  }

  async purgeCompletedJobs(olderThanHours = 24): Promise<number> {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    
    const result = await db
      .delete(engineJobs)
      .where(and(
        eq(engineJobs.status, 'done'),
        lte(engineJobs.created_at, cutoffTime)
      ));
    
    const deletedCount = result.rowCount || 0;
    if (deletedCount > 0) {
      console.log(`[JobQueue] Purged ${deletedCount} completed jobs older than ${olderThanHours} hours`);
    }
    
    return deletedCount;
  }

  private async processJobs(): Promise<void> {
    if (this.isProcessing) {
      return; // Prevent concurrent processing
    }

    this.isProcessing = true;
    
    try {
      const jobs = await this.getReadyJobs();
      
      if (jobs.length === 0) {
        return;
      }

      console.log(`[JobQueue] Processing ${jobs.length} ready jobs`);
      
      // Process jobs sequentially to avoid overwhelming the system
      for (const job of jobs) {
        try {
          await this.processJob(job);
        } catch (error) {
          console.error(`[JobQueue] Error processing job ${job.id}:`, error);
          await this.markJobFailed(job.id, error instanceof Error ? error.message : 'Unknown error');
        }
      }
    } catch (error) {
      console.error('[JobQueue] Error in job processing loop:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processJob(job: QueuedJob): Promise<void> {
    console.log(`[JobQueue] Processing job ${job.id} (${job.kind})`);
    
    await this.markJobRunning(job.id);
    
    // Job processing would be handled by JobExecutor
    // For now, we'll just mark as completed after a short delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await this.markJobCompleted(job.id);
  }

  async getQueueStats(): Promise<{
    queued: number;
    running: number;
    completed: number;
    failed: number;
  }> {
    const stats = await db
      .select({ 
        status: engineJobs.status
      })
      .from(engineJobs)
      .groupBy(engineJobs.status);
    
    const counts = stats.reduce((acc, stat) => {
      acc[stat.status] = (acc[stat.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      queued: counts['queued'] || 0,
      running: counts['running'] || 0,
      completed: counts['done'] || 0,
      failed: counts['dead'] || 0,
    };
  }
}