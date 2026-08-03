import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // pino loads its transport in a worker thread, which only works when the
  // package is left out of the server bundle.
  serverExternalPackages: ['pino', 'pino-pretty'],
};

export default nextConfig;
