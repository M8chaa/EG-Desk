/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        dns: false,
        tls: false,
        fs: false,
      };
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/websocket',
        destination: '/api/websocket',
      },
    ];
  },
};

export default nextConfig;
