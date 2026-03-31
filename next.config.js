/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
    // Ship Prisma query engines inside serverless bundles (fixes "works locally, fails on Netlify").
    outputFileTracingIncludes: {
      "/*": [
        "./node_modules/.prisma/client/**/*",
        "./node_modules/@prisma/client/**/*",
      ],
    },
  },
};

module.exports = nextConfig;
