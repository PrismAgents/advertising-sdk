/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/client',
  reactStrictMode: true,
  webpack: config => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
  images: {
    formats: ['image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        pathname: '**',
      }
    ],
    unoptimized: true,
  },
};

module.exports = nextConfig;
