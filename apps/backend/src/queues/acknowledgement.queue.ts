import { Queue, Worker } from 'bullmq';
import { loadEnv } from '../config/env.js';
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
    console.warn(
      'REDIS_URL not set — processing acknowledgement inline (dev fallback)',
    );
    setImmediate(() => {
      processAcknowledgementJob(payload).catch((err) => {
        console.error('Inline acknowledgement job failed:', err);
      });
    });
    return;
  }

  await q.add('send-acknowledgement', payload, {
    jobId: acknowledgementJobId(payload.ticketId),
  });
}

export function startAckWorker(): void {
  const conn = getConnection();
  if (!conn || worker) return;

  const env = loadEnv();
  worker = new Worker<AcknowledgementJobPayload>(
    env.ACK_QUEUE_NAME,
    async (job) => {
      await processAcknowledgementJob(job.data);
    },
    { connection: conn, concurrency: env.ACK_QUEUE_CONCURRENCY },
  );

  worker.on('failed', (job, err) => {
    console.error(
      `Acknowledgement job ${job?.id ?? 'unknown'} failed (attempt ${job?.attemptsMade ?? 0}):`,
      err.message,
    );
  });

  console.log('Acknowledgement worker started');
}

export async function closeAckWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
  if (queue) {
    await queue.close();
    queue = null;
  }
  connection = null;
}
