import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  serverExternalPackages: ['postgres'],
};

export default nextConfig;
