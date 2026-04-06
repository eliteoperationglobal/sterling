/**
 * Get Puppeteer browser configuration for serverless environments
 * DEPRECATED: Use generatePDFFromHTML from @/lib/services/pdf/PDFService instead
 * Puppeteer is not supported in Vercel production - use PDFShift or Browserless.io
 */
export async function getPuppeteerBrowser() {
  // Check if we're in a production/serverless environment
  const isProduction = process.env.VERCEL || 
                       process.env.VERCEL_ENV || 
                       process.env.NODE_ENV === 'production' ||
                       process.env.AWS_LAMBDA_FUNCTION_NAME;
  
  if (isProduction) {
    throw new Error(
      'Puppeteer is not supported in production/serverless environments (Vercel). ' +
      'Please use generatePDFFromHTML from @/lib/services/pdf/PDFService instead, ' +
      'which uses PDFShift or Browserless.io. ' +
      'Ensure PDFSHIFT_API_KEY is set in your Vercel environment variables.'
    );
  }
  
  // Only allow Puppeteer in local development
  const isLocalDev = process.env.NODE_ENV === 'development' && !isProduction;
  
  if (!isLocalDev) {
    throw new Error(
      'Puppeteer is only available in local development. ' +
      'For production, use generatePDFFromHTML from @/lib/services/pdf/PDFService.'
    );
  }
  
  // Try serverless Chromium first (for local dev testing)
  try {
    console.log("[Puppeteer] Attempting to use serverless Chromium (local dev only)...");
    console.log("[Puppeteer] Environment:", {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    });
    
    const puppeteer = await import("puppeteer-core");
    const chromium = await import("@sparticuz/chromium");
    
    const executablePath = await chromium.default.executablePath();
    
    console.log("[Puppeteer] Chromium executable path:", executablePath);
    
    return await puppeteer.default.launch({
      args: chromium.default.args,
      defaultViewport: chromium.default.defaultViewport,
      executablePath: executablePath,
      headless: chromium.default.headless,
    });
  } catch (error: any) {
    console.error("[Puppeteer] Serverless Chromium failed:", error.message);
    
    // Fall back to regular Puppeteer in local dev
    console.log("[Puppeteer] Falling back to regular Puppeteer for local dev");
    try {
      const puppeteer = await import("puppeteer");
      return await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        timeout: 30000,
      });
    } catch (fallbackError: any) {
      console.error("[Puppeteer] Fallback also failed:", fallbackError.message);
      throw new Error(`Failed to launch browser: ${error.message}. Please use generatePDFFromHTML with PDFShift for production.`);
    }
  }
}
