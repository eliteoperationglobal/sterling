

export const cssContent = `
	:root {
	  /* Brand Colors */
	  --primary: #003366;
	  --secondary: #666666;
	  --accent: #d4af37;
	  --bg-light: #f9f9f9;
	  --text-dark: #1a1a1a;
	  --border-color: #e0e0e0;
	  
	  /* Typography */
	  --font-main: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	  --font-serif: 'Playfair Display', serif;
	}

	* {
	  box-sizing: border-box;
	  -webkit-print-color-adjust: exact;
	}

	body, html {
	  margin: 0;
	  padding: 0;
	  font-family: var(--font-main);
	  color: var(--text-dark);
	  line-height: 1.4;
	  background: white;
	}

	.page {
	  width: 210mm;
	  min-height: 297mm;
	  padding: 15mm;
	  margin: 0 auto;
	  background: white;
	  position: relative;
	  overflow: hidden;
	  page-break-after: always;
	}

	/* PAGE 2 - INITIAL SUBMISSION CHECKLIST (ISC) STYLES - UNIVERSAL VERSION */
	.page2-isc {
	  display: flex;
	  flex-direction: column;
	  border: 1px solid #eee;
	}

	.main-content-page2 {
	  flex: 1;
	  display: flex;
	  flex-direction: column;
	  gap: 15px;
	}

	/* Header - Logo & Agency Info */
	.header-top-page2 {
	  display: flex;
	  justify-content: space-between;
	  align-items: flex-start;
	  margin-bottom: 20px;
	  padding-bottom: 15px;
	  border-bottom: 2px solid var(--primary);
	}

	.agency-info-page2-left {
	  flex: 1;
	}

	.agency-name-page2 {
	  font-size: 20px;
	  font-weight: 800;
	  color: var(--primary);
	  text-transform: uppercase;
	  letter-spacing: 1px;
	}

	.agency-details-small-page2 {
	  font-size: 11px;
	  color: var(--secondary);
	  margin-top: 4px;
	}

	.logo-container-page2 {
	  width: 220px;
	  display: flex;
	  justify-content: flex-end;
	}

	.logo-container-page2 svg {
	  max-width: 100%;
	  height: auto;
	}

	/* Form Title Section */
	.form-title-section-page2 {
	  text-align: center;
	  margin-bottom: 25px;
	}

	.form-title-page2 {
	  font-size: 26px;
	  font-weight: 800;
	  color: var(--primary);
	  margin: 0;
	  letter-spacing: -0.5px;
	}

	.form-subtitle-page2 {
	  font-size: 14px;
	  color: var(--accent);
	  font-weight: 600;
	  text-transform: uppercase;
	  margin-top: 5px;
	}

	/* VERTICAL GRID SYSTEM - SINGLE COLUMN */
	.universal-grid-vertical {
	  display: flex;
	  flex-direction: column;
	  gap: 15px;
	}

	.data-section-vertical {
	  border: 1px solid var(--border-color);
	  border-radius: 8px;
	  overflow: hidden;
	  background: var(--bg-light);
	}

	.section-header-vertical {
	  background: var(--primary);
	  color: white;
	  padding: 8px 15px;
	  font-size: 13px;
	  font-weight: 700;
	  text-transform: uppercase;
	  letter-spacing: 0.5px;
	}

	.section-body-vertical {
	  padding: 15px;
	  display: flex;
	  flex-direction: column;
	  gap: 12px;
	}

	/* Row Styling within sections */
	.data-row-vertical {
	  display: flex;
	  flex-wrap: wrap;
	  gap: 20px;
	  border-bottom: 1px solid #eee;
	  padding-bottom: 8px;
	}

	.data-row-vertical:last-child {
	  border-bottom: none;
	  padding-bottom: 0;
	}

	.data-field-vertical {
	  flex: 1;
	  min-width: 150px;
	}

	.field-label-vertical {
	  font-size: 10px;
	  color: var(--secondary);
	  text-transform: uppercase;
	  font-weight: 600;
	  margin-bottom: 3px;
	}

	.field-value-vertical {
	  font-size: 13px;
	  font-weight: 500;
	  color: var(--text-dark);
	}

	/* Tables */
	.universal-table {
	  width: 100%;
	  border-collapse: collapse;
	  margin-top: 5px;
	}

	.universal-table th {
	  background: #f0f0f0;
	  padding: 8px;
	  text-align: left;
	  font-size: 11px;
	  font-weight: 700;
	  border-bottom: 2px solid var(--primary);
	}

	.universal-table td {
	  padding: 8px;
	  font-size: 12px;
	  border-bottom: 1px solid #eee;
	}

	/* Signatures */
	.signature-block-vertical {
	  margin-top: auto;
	  padding-top: 30px;
	  display: flex;
	  justify-content: space-between;
	  gap: 40px;
	}

	.signature-line-container {
	  flex: 1;
	}

	.signature-line {
	  border-bottom: 1px solid var(--text-dark);
	  height: 40px;
	}

	.signature-label {
	  font-size: 11px;
	  margin-top: 5px;
	  font-weight: 600;
	}

	/* Checklist Specific */
	.checklist-grid {
	  display: grid;
	  grid-template-columns: 1fr 1fr;
	  gap: 10px;
	}

	.checklist-item {
	  display: flex;
	  align-items: center;
	  gap: 8px;
	  font-size: 12px;
	}

	.check-box {
	  width: 14px;
	  height: 14px;
	  border: 1px solid var(--primary);
	  display: flex;
	  align-items: center;
	  justify-content: center;
	  font-size: 10px;
	  font-weight: bold;
	  color: var(--primary);
	}
`;
