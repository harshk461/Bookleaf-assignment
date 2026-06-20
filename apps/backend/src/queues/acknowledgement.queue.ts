import { Queue, Worker } from 'bullmq';
import { loadEnv } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { processAcknowledgementJob } from './acknowledgement.processor.js';
import {
  acknowledgementJobId,
  type AcknowledgementJobPayload,
} from './acknowledgement.types.js';

type RedisConnection = { url: string; maxRetriesPerRequest: null };

let connection: RedisConnection | null = null;
let queue: Queue<AcknowledgementJobPayload> | null = null;
let worker: Worker<AcknowledgementJobPayload> | null = null;

function getConnection(): RedisConnection | null {
  const env = loadEnv();
  if (!env.REDIS_URL) return null;
  if (!connection) {
    connection = { url: env.REDIS_URL, maxRetriesPerRequest: null };
  }
  return connection;
}

function getQueue(): Queue<AcknowledgementJobPayload> | null {
  const conn = getConnection();
  if (!conn) return null;

  if (!queue) {
    const env = loadEnv();
    queue = new Queue<AcknowledgementJobPayload>(env.ACK_QUEUE_NAME, {
      connection: conn,
      defaultJobOptions: {
        attempts: env.ACK_QUEUE_ATTEMPTS,
        backoff: { type: 'exponential', delay: env.ACK_QUEUE_BACKOFF_MS },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });
  }
  return queue;
}

export async function enqueueAcknowledgement(
  payload: AcknowledgementJobPayload,
): Promise<void> {
  const q = getQueue();
  if (!q) {
    logger.warn(
      { ticketId: payload.ticketId, ticketNumber: payload.ticketNumber },
      'REDIS_URL not set — processing acknowledgement inline (dev fallback)',
    );
    setImmediate(() => {
      processAcknowledgementJob(payload).catch((err) => {
        logger.error(
          { err, ticketId: payload.ticketId, ticketNumber: payload.ticketNumber },
          'Inline acknowledgement job failed',
        );
      });
    });
    return;
  }

  const jobId = acknowledgementJobId(payload.ticketId);
  await q.add('send-acknowledgement', payload, { jobId });
  logger.info(
    { ticketId: payload.ticketId, ticketNumber: payload.ticketNumber, jobId },
    'Acknowledgement job enqueued',
  );
}

export function startAckWorker(): void {
  const conn = getConnection();
  if (!conn || worker) return;

  const env = loadEnv();
  worker = new Worker<AcknowledgementJobPayload>(
    env.ACK_QUEUE_NAME,
    async (job) => {
      logger.info(
        { jobId: job.id, ticketId: job.data.ticketId, attempt: job.attemptsMade + 1 },
        'Processing acknowledgement job',
      );
      await processAcknowledgementJob(job.data);
    },
    { connection: conn, concurrency: env.ACK_QUEUE_CONCURRENCY },
  );

  worker.on('completed', (job) => {
    logger.info(
      { jobId: job.id, ticketId: job.data.ticketId },
      'Acknowledgement job completed',
    );
  });

  worker.on('failed', (job, err) => {
    logger.error(
      {
        err,
        jobId: job?.id,
        ticketId: job?.data.ticketId,
        attempt: job?.attemptsMade,
      },
      'Acknowledgement job failed',
    );
  });

  logger.info(
    { queue: env.ACK_QUEUE_NAME, concurrency: env.ACK_QUEUE_CONCURRENCY },
    'Acknowledgement worker started',
  );
}

export async function closeAckWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    logger.info('Acknowledgement worker stopped');
  }
  if (queue) {
    await queue.close();
    queue = null;
  }
  connection = null;
}
