
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
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.docx', '.doc', '.xlsx', '.xls'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Only DOCX, DOC, XLSX, and XLS files are allowed.'));
    }
  }
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// PDF conversion endpoint
app.post('/api/convert-to-pdf', upload.single('file'), async (req, res) => {
  let tempFilePath = null;
  let outputFilePath = null;
  
  try {
    console.log('=== PDF Conversion Request ===');
    console.log('Request received at:', new Date().toISOString());
    
    if (!req.file) {
      console.error('No file uploaded in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File details:', {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      destination: req.file.destination,
      filename: req.file.filename
    });
    
    tempFilePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    // Validate file type
    if (!['.docx', '.doc', '.xlsx', '.xls'].includes(fileExtension)) {
      console.error('Unsupported file type:', fileExtension);
      return res.status(400).json({ error: `Unsupported file type: ${fileExtension}` });
    }

    // Create output file path
    outputFilePath = `${tempFilePath}.pdf`;
    
    // Check if LibreOffice is available
    try {
      await execAsync('libreoffice --version');
      console.log('LibreOffice is available');
    } catch (versionError) {
      console.error('LibreOffice version check failed:', versionError);
      return res.status(500).json({ 
        error: 'LibreOffice is not available on this server',
        details: versionError.message 
      });
    }
    
    // LibreOffice conversion command
    const outputDir = path.dirname(tempFilePath);
    const command = `libreoffice --headless --convert-to pdf --outdir "${outputDir}" "${tempFilePath}"`;
    
    console.log('Executing LibreOffice command:', command);
    console.log('Working directory:', process.cwd());
    console.log('Output directory:', outputDir);
    
    // Execute conversion with detailed logging
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 45000, // 45 second timeout
        cwd: process.cwd()
      });
      
      console.log('LibreOffice conversion completed');
      if (stdout) console.log('LibreOffice stdout:', stdout);
      if (stderr) console.log('LibreOffice stderr:', stderr);
    } catch (execError) {
      console.error('LibreOffice execution failed:', execError);
      return res.status(500).json({ 
        error: 'LibreOffice conversion failed',
        details: execError.message,
        stderr: execError.stderr,
        stdout: execError.stdout
      });
    }
    
    // Check if PDF was created
    try {
      const stats = await fs.stat(outputFilePath);
      console.log('PDF file created successfully, size:', stats.size);
      
      if (stats.size === 0) {
        console.error('PDF file is empty');
        return res.status(500).json({ error: 'PDF conversion resulted in empty file' });
      }
    } catch (statError) {
      console.error('PDF file not found after conversion:', statError);
      
      // List files in the output directory for debugging
      try {
        const files = await fs.readdir(outputDir);
        console.log('Files in output directory:', files);
      } catch (listError) {
        console.error('Could not list output directory:', listError);
      }
      
      return res.status(500).json({ 
        error: 'PDF file was not created',
        details: statError.message 
      });
    }
    
    // Read the PDF file
    const pdfBuffer = await fs.readFile(outputFilePath);
    console.log('PDF file read successfully, buffer size:', pdfBuffer.length);
    
    // Set response headers
    const filename = path.basename(req.file.originalname, fileExtension) + '.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send PDF
    res.send(pdfBuffer);
    
    console.log('=== PDF Conversion Successful ===');
    console.log('Original file:', req.file.originalname);
    console.log('PDF size:', pdfBuffer.length);
    
  } catch (error) {
    console.error('=== PDF Conversion Error ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      error: 'PDF conversion failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    // Clean up temporary files
    console.log('Cleaning up temporary files...');
    try {
      if (tempFilePath) {
        await fs.unlink(tempFilePath);
        console.log('Cleaned up temp file:', tempFilePath);
      }
      if (outputFilePath) {
        await fs.unlink(outputFilePath);
        console.log('Cleaned up output file:', outputFilePath);
      }
    } catch (cleanupError) {
      console.warn('Cleanup error (non-critical):', cleanupError.message);
    }
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  console.log('Health check requested');
  
  try {
    // Check LibreOffice availability
    const { stdout } = await execAsync('libreoffice --version', { timeout: 5000 });
    console.log('LibreOffice version check passed:', stdout.trim());
    
    res.json({ 
      status: 'ok', 
      libreoffice: 'available',
      version: stdout.trim(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'error', 
      libreoffice: 'unavailable',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Serve the React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('=== Server Error ===');
  console.error('Error:', error);
  console.error('Request URL:', req.url);
  console.error('Request method:', req.method);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
    }
    return res.status(400).json({ error: error.message });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    details: error.message,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=== PDF Generator Server Started ===`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('LibreOffice PDF conversion service ready');
  
  // Test LibreOffice availability on startup
  exec('libreoffice --version', (error, stdout, stderr) => {
    if (error) {
      console.error('WARNING: LibreOffice not found on startup:', error.message);
    } else {
      console.log('LibreOffice version:', stdout.trim());
    }
  });
});
