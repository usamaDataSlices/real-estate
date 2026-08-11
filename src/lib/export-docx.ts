import { saveAs } from 'file-saver'

export function exportToDocx(htmlContent: string, filename: string = 'document.docx') {
  try {
    // Create a complete MS Word-ready HTML wrapper with styling
    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="utf-8">
          <title>Document</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            body { font-family: 'Arial', sans-serif; font-size: 11.5pt; line-height: 1.5; color: #1C1B19; }
            h1 { font-size: 20pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; color: #0F1A2C; }
            h2 { font-size: 16pt; font-weight: bold; margin-top: 12pt; margin-bottom: 4pt; color: #1F2E47; }
            h3 { font-size: 13pt; font-weight: bold; margin-top: 12pt; margin-bottom: 2pt; color: #1F2E47; }
            p { margin-bottom: 6pt; margin-top: 0; }
            ul, ol { margin-top: 0; margin-bottom: 6pt; padding-left: 20px; }
            li { margin-bottom: 3pt; }
            a { color: #C5A880; text-decoration: underline; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 12pt; }
            th, td { border: 1px solid #D3CEBF; padding: 8px; text-align: left; }
            th { background-color: #FAF9F6; font-weight: bold; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `
    // We add the UTF-8 BOM (\ufeff) to make sure Word opens it with characters decoded correctly
    const blob = new Blob(['\ufeff' + header], { type: 'application/msword' })
    const cleanFilename = filename.endsWith('.docx') ? filename : `${filename}.docx`
    saveAs(blob, cleanFilename)
  } catch (error) {
    console.error('Error generating DOCX:', error)
    alert('Failed to generate DOCX file.')
  }
}
