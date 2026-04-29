/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    TZ: 'America/Sao_Paulo',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        hostname: 'picsum.photos',
      }
    ]
  },
};

export default nextConfig;
