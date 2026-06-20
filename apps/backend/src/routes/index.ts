import type { FastifyInstance } from 'fastify';

export async function registerRoutes(app: FastifyInstance) {
  const { registerHealthRoutes } = await import('./admin/health.routes.js');
  await registerHealthRoutes(app);

  const [
    { authRoutes },
    { authorBooksRoutes },
    { authorTicketsRoutes },
    { adminTicketsRoutes },
  ] = await Promise.all([
    import('./auth.routes.js'),
    import('./author/books.routes.js'),
    import('./author/tickets.routes.js'),
    import('./admin/tickets.routes.js'),
  ]);

  await app.register(authRoutes);
  await app.register(authorBooksRoutes);
  await app.register(authorTicketsRoutes);
  await app.register(adminTicketsRoutes);
}
