import { Workbook } from 'exceljs';
import { TemplateHandler, MimeType } from 'easy-template-x';
import { Buffer } from 'buffer';
import { supabase } from '@/integrations/supabase/client';
import { convertToPdfOnServer, checkServerHealth } from './serverPdfGenerator';

interface ImageData {
  _type: 'image';
  source: Buffer;
  format: MimeType;
  width: number;
  height: number;
  altText?: string;
  transparencyPercent?: number;
}

type PlaceholderValue = string | ImageData;

interface GenerationOptions {
  templateId: string;
  templateName: string;
  placeholderData: Record<string, PlaceholderValue>;
  placeholders: string[];
  format: 'pdf' | 'docx' | 'xlsx';
  userId: string;
}

// Helper function to convert base64 image to ImageData with proper format
const convertBase64ToImageData = async (base64String: string, altText: string = ''): Promise<ImageData> => {
  console.log('Converting base64 to ImageData for:', altText);
  
  // Remove data URL prefix if present
  const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Determine format from the original string and use proper MimeType
  let format: MimeType = MimeType.Png; // Default to PNG
  if (base64String.includes('data:image/jpeg') || base64String.includes('data:image/jpg')) {
    format = MimeType.Jpeg;
  } else if (base64String.includes('data:image/gif')) {
    format = MimeType.Gif;
  }
  
  console.log('Detected image format:', format);
  
  return {
    _type: 'image',
    source: buffer,
    format: format,
    width: 200,
    height: 200,
    altText: altText
  };
};

const handleExcel = async (templateBuffer: ArrayBuffer, data: Record<string, PlaceholderValue>): Promise<Blob> => {
  const workbook = new Workbook();
  await workbook.xlsx.load(templateBuffer);
  
  workbook.worksheets.forEach(worksheet => {
    worksheet.eachRow((row) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        if (cell && cell.value !== null && cell.value !== undefined) {
          let cellText = '';
          
          // Handle different cell value types safely
          if (typeof cell.value === 'string') {
            cellText = cell.value;
          } else if (typeof cell.value === 'number') {
            cellText = cell.value.toString();
          } else if (cell.value && typeof cell.value === 'object' && 'text' in cell.value && cell.value.text) {
            cellText = cell.value.text;
          } else if (cell.text) {
            cellText = cell.text;
          }

          const originalStyle = {
            font: cell.font ? { ...cell.font } : undefined,
            alignment: cell.alignment ? { ...cell.alignment } : undefined,
            border: cell.border ? { ...cell.border } : undefined,
            fill: cell.fill ? { ...cell.fill } : undefined,
            numFmt: cell.numFmt,
            protection: cell.protection ? { ...cell.protection } : undefined
          };

          let finalText = cellText;
          let hasChanges = false;

          Object.entries(data).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            if (regex.test(finalText)) {
              // Handle different value types as objects
              let replacementText = '';
              
              if (typeof value === 'string') {
                // Check if it's a base64 image
                if (value.startsWith('data:image/')) {
                  replacementText = '[Image]';
                } else {
                  replacementText = value;
                }
              } else if (value && typeof value === 'object' && '_type' in value && value._type === 'image') {
                replacementText = '[Image]';
              } else {
                replacementText = String(value || '');
              }
              
              finalText = finalText.replace(regex, replacementText);
              hasChanges = true;
            }
          });

          if (hasChanges) {
            cell.value = finalText;
            
            // Restore original styling
            if (originalStyle.font) cell.font = originalStyle.font;
            if (originalStyle.alignment) cell.alignment = originalStyle.alignment;
            if (originalStyle.border) cell.border = originalStyle.border;
            if (originalStyle.fill) cell.fill = originalStyle.fill;
            if (originalStyle.numFmt) cell.numFmt = originalStyle.numFmt;
            if (originalStyle.protection) cell.protection = originalStyle.protection;
          }
        }
      });
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
};

const handleWord = async (templateBuffer: ArrayBuffer, data: Record<string, PlaceholderValue>): Promise<Blob> => {
  console.log('Starting Word document processing...');
  const handler = new TemplateHandler();
  
  // Process the data with exact format required by easy-template-x
  const processedData: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    console.log(`Processing placeholder: ${key}`);
    
    if (typeof value === 'string') {
      // Check if it's a base64 image
      if (value.startsWith('data:image/')) {
        try {
          console.log(`Converting image for placeholder: ${key}`);
          const imageData = await convertBase64ToImageData(value, key);
          
          // Use exact format as specified by easy-template-x
          processedData[key] = {
            _type: 'image',
            source: imageData.source,
            format: imageData.format,
            width: imageData.width,
            height: imageData.height,
            altText: imageData.altText || key
          };
          
          console.log(`Successfully processed image for ${key}:`, {
            format: imageData.format,
            width: imageData.width,
            height: imageData.height,
            bufferSize: imageData.source.length
          });
        } catch (error) {
          console.error(`Failed to process image for ${key}:`, error);
          processedData[key] = '[Image could not be processed]';
        }
      } else {
        processedData[key] = value;
      }
    } else if (value && typeof value === 'object' && '_type' in value && value._type === 'image') {
      // Handle ImageData objects with proper format
      processedData[key] = {
        _type: 'image',
        source: value.source,
        format: value.format || MimeType.Png,
        width: value.width,
        height: value.height,
        altText: value.altText || key
      };
      console.log(`Using existing ImageData for ${key}`);
    } else {
      processedData[key] = String(value || '');
    }
  }

  console.log('Processing document with data keys:', Object.keys(processedData));
  console.log('Processed data structure:', JSON.stringify(processedData, (key, value) => {
    if (value instanceof Buffer) return '[Buffer]';
    return value;
  }, 2));

  try {
    console.log('Calling easy-template-x handler.process...');
    const doc = await handler.process(templateBuffer, processedData);
    console.log('Document processed successfully, size:', doc.byteLength);
    return new Blob([doc], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
  } catch (error) {
    console.error('Error processing Word template:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    throw new Error(`Document processing failed: ${error.message}`);
  }
};

const convertToPdfUsingLibreOffice = async (blob: Blob, originalFileName: string): Promise<Blob> => {
  console.log('Converting to PDF using LibreOffice:', originalFileName);
  
  try {
    const formData = new FormData();
    formData.append('file', blob, originalFileName);

    const response = await fetch('/api/convert-to-pdf', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`PDF conversion failed: ${errorData.error || response.statusText}`);
    }

    const pdfBlob = await response.blob();
    console.log('LibreOffice PDF conversion successful, size:', pdfBlob.size);
    
    if (pdfBlob.size === 0) {
      throw new Error('PDF conversion resulted in an empty file');
    }
    
    return pdfBlob;
  } catch (error) {
    console.error('LibreOffice conversion failed:', error);
    throw new Error(`PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const generateEnhancedPDF = async ({ 
  templateId,
  templateName, 
  placeholderData,
  format,
  userId 
}: GenerationOptions): Promise<void> => {
  try {
    console.log('=== Starting Enhanced Document Generation ===');
    console.log('Template ID:', templateId);
    console.log('Format:', format);
    console.log('User ID:', userId);
    console.log('Placeholder data keys:', Object.keys(placeholderData));
    
    // Get template info from database
    console.log('Fetching template from database...');
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) {
      console.error('Template fetch error:', templateError);
      throw new Error(`Template fetch error: ${templateError.message}`);
    }
    if (!template) {
      console.error('Template not found');
      throw new Error('Template not found');
    }

    console.log('Template found:', template.name, 'File path:', template.file_path);

    // Download template file from Supabase storage
    console.log('Downloading template file from storage...');
    const { data: fileData, error: fileError } = await supabase.storage
      .from('templates')
      .download(template.file_path);

    if (fileError) {
      console.error('Template download error:', fileError);
      throw new Error(`Template download error: ${fileError.message}`);
    }
    if (!fileData) {
      console.error('Template file is empty');
      throw new Error('Template file is empty');
    }

    console.log('Template file downloaded successfully, size:', fileData.size);
    
    const templateBuffer = await fileData.arrayBuffer();
    console.log('Template buffer created, size:', templateBuffer.byteLength);
    
    let resultBlob: Blob;
    let finalFormat = format;

    // Process based on format
    switch (format) {
      case 'xlsx':
        console.log('Processing Excel document...');
        resultBlob = await handleExcel(templateBuffer, placeholderData);
        break;
      case 'docx':
        console.log('Processing Word document...');
        resultBlob = await handleWord(templateBuffer, placeholderData);
        break;
      case 'pdf':
        console.log('Processing document for PDF conversion...');
        if (template.name.endsWith('.xlsx')) {
          // For Excel templates, first generate xlsx then convert to PDF
          console.log('Processing Excel template for PDF...');
          const excelBlob = await handleExcel(templateBuffer, placeholderData);
          resultBlob = await convertToPdfUsingLibreOffice(excelBlob, template.name);
          finalFormat = 'pdf';
        } else {
          // For Word templates, first generate docx then convert to PDF
          console.log('Processing Word template for PDF...');
          const wordBlob = await handleWord(templateBuffer, placeholderData);
          resultBlob = await convertToPdfUsingLibreOffice(wordBlob, template.name);
          finalFormat = 'pdf';
        }
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    console.log('Document processed successfully, blob size:', resultBlob.size);

    // Generate filename
    const baseFileName = templateName.replace(/\.[^/.]+$/, '');
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${baseFileName}_${timestamp}`;
    const fullFileName = `${fileName}.${finalFormat}`;

    console.log('Generated filename:', fullFileName);

    // Upload to Supabase storage
    const storagePath = `${userId}/${Date.now()}-${fullFileName}`;
    console.log('Uploading to storage path:', storagePath);
    
    const { error: uploadError } = await supabase.storage
      .from('generated-pdfs')
      .upload(storagePath, resultBlob);

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Storage upload error: ${uploadError.message}`);
    }

    console.log('File uploaded to storage successfully');

    // Convert placeholderData to JSON-compatible format for database storage
    const jsonPlaceholderData: Record<string, any> = {};
    Object.entries(placeholderData).forEach(([key, value]) => {
      if (typeof value === 'string' && value.startsWith('data:image/')) {
        jsonPlaceholderData[key] = '[Image]';
      } else if (typeof value === 'object' && value && '_type' in value && value._type === 'image') {
        jsonPlaceholderData[key] = '[Image]';
      } else {
        jsonPlaceholderData[key] = typeof value === 'string' ? value : String(value || '');
      }
    });

    // Save metadata to database
    console.log('Saving metadata to database...');
    const { data: generatedFile, error: insertError } = await supabase
      .from('generated_pdfs')
      .insert({
        name: fullFileName,
        user_id: userId,
        template_id: templateId,
        file_path: storagePath,
        file_size: resultBlob.size,
        placeholder_data: jsonPlaceholderData,
        generated_date: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Database insert error: ${insertError.message}`);
    }

    console.log('Metadata saved to database successfully');

    // Update template use count
    console.log('Updating template use count...');
    await supabase
      .from('templates')
      .update({ 
        use_count: (template.use_count || 0) + 1 
      })
      .eq('id', templateId);

    // Log activity
    console.log('Logging activity...');
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: `${finalFormat.toUpperCase()} Generated`,
        resource_type: 'generated_file',
        resource_id: generatedFile.id,
        metadata: { 
          template_name: template.name,
          generated_name: fullFileName,
          placeholders_filled: Object.keys(placeholderData).length
        }
      });

    // Trigger download
    console.log('Triggering download...');
    const url = window.URL.createObjectURL(resultBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fullFileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    console.log('=== Document Generation Complete ===');
    console.log('Document generated, saved to Supabase, and download triggered successfully');

  } catch (error) {
    console.error('=== Document Generation Failed ===');
    console.error('Error generating document:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
};
