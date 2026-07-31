import type {FastifyPluginAsync} from 'fastify';
import {WIDGET_CONFIG} from '../config.ts';

export const widgetRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/widget', async () => WIDGET_CONFIG);
};
