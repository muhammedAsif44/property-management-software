/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@orvyn/ui', '@orvyn/utils', '@orvyn/shared-types'],
};

module.exports = nextConfig;
