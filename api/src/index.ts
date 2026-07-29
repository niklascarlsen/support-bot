import 'dotenv/config';
import cors from '@fastify/cors';
import Fastify from 'fastify';
import {chatRoutes} from './routes/chat.ts';

const port = Number(process.env.PORT ?? 8080);
const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

const isProd = process.env.NODE_ENV === 'production';

const fastify = Fastify({
  logger: isProd
    ? true
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      },
  forceCloseConnections: true,
});

await fastify.register(cors, {
  origin: corsOrigin,
});

await fastify.register(chatRoutes, {prefix: '/api'});

fastify.get('/health', async () => ({ok: true}));
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    await fastify.close();
    process.exit(0);
  });
}

try {
  await fastify.listen({port, host: '0.0.0.0'});
} catch (error) {
  fastify.log.error(error);
  process.exit(1);
}
