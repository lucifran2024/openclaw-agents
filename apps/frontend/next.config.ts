import type { NextConfig } from 'next';

const useStandaloneOutput = process.env.NEXT_OUTPUT_MODE === 'standalone';

const nextConfig: NextConfig = {
  ...(useStandaloneOutput ? { output: 'standalone' as const } : {}),
  transpilePackages: ['@repo/shared'],
};

export default nextConfig;
