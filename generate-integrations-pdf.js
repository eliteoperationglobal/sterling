/**
 * Script to generate PDF from HTML using PDFShift API
 * Run: node generate-integrations-pdf.js
 */

const fs = require('fs');
const path = require('path');

async function generatePDF() {
  try {
    // Read HTML file
    const htmlPath = path.join(__dirname, 'REAL_INTEGRATIONS_REQUIRED.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Get PDFShift API key from environment
    const PDFSHIFT_API_KEY = process.env.PDFSHIFT_API_KEY;
    
    if (!PDFSHIFT_API_KEY) {
      console.error('❌ PDFSHIFT_API_KEY not found in environment variables');
      console.log('💡 Add it to .env.local or set it in terminal:');
      console.log('   $env:PDFSHIFT_API_KEY="your_key_here"');
      process.exit(1);
    }
    
    console.log('📄 Generating PDF from HTML...');
    console.log('📝 HTML file size:', (htmlContent.length / 1024).toFixed(2), 'KB');
    
    // Call PDFShift API
    const response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': PDFSHIFT_API_KEY,
      },
      body: JSON.stringify({
        source: htmlContent,
        format: 'a4',
        margin: '20px',
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ PDFShift API error:', response.status, errorText);
      process.exit(1);
    }
    
    // Save PDF
    const pdfBuffer = Buffer.from(await response.arrayBuffer());
    const outputPath = path.join(__dirname, 'REAL_INTEGRATIONS_REQUIRED.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    
    console.log('✅ PDF generated successfully!');
    console.log('📁 Saved to:', outputPath);
    console.log('📊 PDF size:', (pdfBuffer.length / 1024).toFixed(2), 'KB');
    
    // Open the PDF
    const { exec } = require('child_process');
    exec(`start ${outputPath}`, (error) => {
      if (error) {
        console.log('💡 PDF saved. Open it manually from:', outputPath);
      }
    });
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error.message);
    process.exit(1);
  }
}

generatePDF();



