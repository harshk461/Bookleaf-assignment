import type { FastifyReply, FastifyRequest } from 'fastify';
import { initSse, sendSseEvent } from './sse.js';

export function runSsePolling(
  request: FastifyRequest,
  reply: FastifyReply,
  eventName: string,
  fetchData: () => Promise<unknown>,
  intervalMs = 5000,
) {
  initSse(reply);
  let closed = false;

  const send = async () => {
    if (closed || reply.raw.writableEnded) return;
    try {
      const data = await fetchData();
      sendSseEvent(reply, eventName, data);
    } catch (err) {
      request.log.error(err);
    }
  };

  void send();
  const interval = setInterval(send, intervalMs);
  request.raw.on('close', () => {
    closed = true;
    clearInterval(interval);
  });
}
