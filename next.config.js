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
  // Ignore build errors for production deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Increase function timeout for PDF generation
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  },
};

module.exports = nextConfig;
