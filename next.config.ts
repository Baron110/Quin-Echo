import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow AudioWorklet files to be served from /worklets/
  async headers() {
    return [
      {
        source: '/worklets/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ];
  },
};

export default nextConfig;
