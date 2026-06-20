import type { FastifyInstance } from 'fastify';
import { probeAiServiceHealth } from '../../services/ai-client.service.js';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ status: 'ok', service: 'backend' }));

  app.get('/health/ai', async () => {
    const ai = await probeAiServiceHealth();
    return {
      reachable: ai.ok,
      url: ai.url,
      triedUrls: ai.triedUrls,
      geminiConfigured: ai.geminiConfigured ?? null,
    };
  });
}
