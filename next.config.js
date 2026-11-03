/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude puppeteer from server-side bundle (use puppeteer-core instead)
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude regular puppeteer from server bundle
      config.externals = config.externals || [];
      config.externals.push({
        'puppeteer': 'commonjs puppeteer',
      });
    }
    return config;
  },
  // Enable standalone output for Docker/VPS, but use standard serverless bundle for Vercel
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // External packages for server components (PDF & Chromium generation)
  experimental: {
    serverComponentsExternalPackages: ['puppeteer', 'puppeteer-core', '@sparticuz/chromium'],
  },
};

module.exports = nextConfig;
