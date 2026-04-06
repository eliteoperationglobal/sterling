/**
 * PDF to Images Converter
 * Converts each page of a PDF to separate image files
 * 
 * Usage: node scripts/convertPdfToImages.js <path-to-pdf>
 * Example: node scripts/convertPdfToImages.js "C:\Users\win\Desktop\application-packet.pdf"
 */

const fs = require('fs');
const path = require('path');

async function convertPdfToImages(pdfPath) {
  try {
    // Check if PDF exists
    if (!fs.existsSync(pdfPath)) {
      console.error(`❌ PDF file not found: ${pdfPath}`);
      process.exit(1);
    }

    console.log(`📄 Found PDF: ${pdfPath}`);
    console.log(`📁 Converting to images...\n`);

    // Try using pdf-poppler (requires poppler-utils to be installed)
    try {
      const pdfPoppler = require('pdf-poppler');
      
      const options = {
        format: 'png',
        out_dir: path.join(process.cwd(), 'pdf-pages'),
        out_prefix: 'page',
        page: null, // Convert all pages
      };

      // Create output directory if it doesn't exist
      if (!fs.existsSync(options.out_dir)) {
        fs.mkdirSync(options.out_dir, { recursive: true });
      }

      await pdfPoppler.convert(pdfPath, options);
      
      console.log(`✅ Successfully converted PDF to images!`);
      console.log(`📂 Images saved to: ${options.out_dir}`);
      console.log(`\n📋 Next steps:`);
      console.log(`   1. Check the 'pdf-pages' folder`);
      console.log(`   2. Upload the images here (page-1.png, page-2.png, etc.)`);
      
    } catch (popplerError) {
      // Fallback: Try using pdf2pic
      try {
        const pdf2pic = require('pdf2pic');
        
        const options = {
          density: 300,
          saveFilename: 'page',
          savePath: path.join(process.cwd(), 'pdf-pages'),
          format: 'png',
          width: 2000,
          height: 2000,
        };

        const convert = pdf2pic.fromPath(pdfPath, options);
        
        // Get total pages first (approximate)
        console.log(`🔄 Converting pages...`);
        
        // Try to convert first 20 pages (adjust if needed)
        for (let page = 1; page <= 20; page++) {
          try {
            await convert(page, { responseType: 'image' });
            console.log(`✅ Converted page ${page}`);
          } catch (err) {
            if (page === 1) throw err; // If first page fails, the library isn't working
            break; // Reached end of PDF
          }
        }
        
        console.log(`\n✅ Successfully converted PDF to images!`);
        console.log(`📂 Images saved to: ${options.savePath}`);
        console.log(`\n📋 Next steps:`);
        console.log(`   1. Check the 'pdf-pages' folder`);
        console.log(`   2. Upload the images here`);
        
      } catch (pdf2picError) {
        // If both libraries fail, provide manual instructions
        console.error(`\n❌ PDF conversion libraries not available.`);
        console.log(`\n📋 Manual Conversion Options:\n`);
        console.log(`Option 1: Use Online Converter`);
        console.log(`   • Go to: https://pdf2jpg.net`);
        console.log(`   • Upload your PDF`);
        console.log(`   • Download all pages as images\n`);
        console.log(`Option 2: Use Windows Built-in`);
        console.log(`   • Open PDF in Microsoft Edge or Chrome`);
        console.log(`   • Press Win + Shift + S to take screenshots`);
        console.log(`   • Save each page as PNG/JPG\n`);
        console.log(`Option 3: Install PDF Tools`);
        console.log(`   • Install: npm install pdf-poppler`);
        console.log(`   • Or: npm install pdf2pic`);
        console.log(`   • Then run this script again\n`);
        console.log(`Option 4: Share PDF Path`);
        console.log(`   • Tell me the full path to your PDF`);
        console.log(`   • I can provide more specific instructions\n`);
      }
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.log(`\n💡 Alternative: Share the PDF file path and I'll help you convert it manually.`);
  }
}

// Get PDF path from command line
const pdfPath = process.argv[2];

if (!pdfPath) {
  console.log(`\n📄 PDF to Images Converter\n`);
  console.log(`Usage: node scripts/convertPdfToImages.js <path-to-pdf>`);
  console.log(`\nExample:`);
  console.log(`  node scripts/convertPdfToImages.js "C:\\Users\\win\\Desktop\\application-packet.pdf"`);
  console.log(`\nOr provide the PDF path and I'll help you convert it.\n`);
  process.exit(1);
}

convertPdfToImages(pdfPath);



