
const express = require('express');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs').promises;
const { promisify } = require('util');

const app = express();
const PORT = process.env.PORT || 10000;
const execAsync = promisify(exec);

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// PDF conversion endpoint
app.post('/api/convert-to-pdf', upload.single('file'), async (req, res) => {
  let tempFilePath = null;
  let outputFilePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Converting file to PDF:', req.file.originalname);
    
    tempFilePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    // Validate file type
    if (!['.docx', '.doc', '.xlsx', '.xls'].includes(fileExtension)) {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    // Create output file path
    outputFilePath = `${tempFilePath}.pdf`;
    
    // LibreOffice conversion command
    const command = `libreoffice --headless --convert-to pdf --outdir ${path.dirname(tempFilePath)} ${tempFilePath}`;
    
    console.log('Executing command:', command);
    
    // Execute conversion
    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000 // 30 second timeout
    });
    
    console.log('LibreOffice stdout:', stdout);
    if (stderr) console.log('LibreOffice stderr:', stderr);
    
    // Check if PDF was created
    try {
      await fs.access(outputFilePath);
    } catch (error) {
      console.error('PDF file not found after conversion:', error);
      return res.status(500).json({ error: 'PDF conversion failed' });
    }
    
    // Read the PDF file
    const pdfBuffer = await fs.readFile(outputFilePath);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(req.file.originalname, fileExtension)}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send PDF
    res.send(pdfBuffer);
    
    console.log('PDF conversion successful for:', req.file.originalname);
    
  } catch (error) {
    console.error('PDF conversion error:', error);
    res.status(500).json({ 
      error: 'PDF conversion failed',
      details: error.message 
    });
  } finally {
    // Clean up temporary files
    try {
      if (tempFilePath) await fs.unlink(tempFilePath);
      if (outputFilePath) await fs.unlink(outputFilePath);
    } catch (cleanupError) {
      console.warn('Cleanup error:', cleanupError);
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', libreoffice: 'available' });
});

// Serve the React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log('LibreOffice PDF conversion service ready');
});
