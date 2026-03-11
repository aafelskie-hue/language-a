/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
  async redirects() {
    return [
      {
        source: '/premium',
        destination: '/workshop',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
