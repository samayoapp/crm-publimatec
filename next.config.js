/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Support hot reload inside Docker containers using polling if needed
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
