
import { Workbook } from 'exceljs';
import { TemplateHandler, MimeType } from 'easy-template-x';
import { Buffer } from 'buffer';
import { supabase } from '@/integrations/supabase/client';

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
  // Remove data URL prefix if present
  const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Determine format from the original string and use proper MimeType
  let format = MimeType.Png;
  if (base64String.includes('data:image/jpeg') || base64String.includes('data:image/jpg')) {
    format = MimeType.Jpeg;
  } else if (base64String.includes('data:image/gif')) {
    format = MimeType.Gif;
  }
  
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
        if (typeof cell.text === 'string') {
          let finalText = cell.text;

          const originalStyle = {
            font: cell.font ? { ...cell.font } : undefined,
            alignment: cell.alignment ? { ...cell.alignment } : undefined,
            border: cell.border ? { ...cell.border } : undefined,
            fill: cell.fill ? { ...cell.fill } : undefined,
            numFmt: cell.numFmt,
            protection: cell.protection ? { ...cell.protection } : undefined
          };

          Object.entries(data).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            const textValue = typeof value === 'string' ? value : '[Image not supported in Excel]';
            finalText = finalText.replace(regex, textValue);
          });

          if (finalText !== cell.text) {
            cell.value = finalText;
            
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
  const handler = new TemplateHandler();
  
  // Process the data with exact format required by easy-template-x
  const processedData: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Check if it's a base64 image
      if (value.startsWith('data:image/')) {
        try {
          const imageData = await convertBase64ToImageData(value, key);
          // Use exact format as specified
          processedData[key] = {
            _type: 'image',
            source: imageData.source,
            format: imageData.format,
            width: imageData.width,
            height: imageData.height,
            altText: imageData.altText || key
          };
          console.log(`Processed image for ${key}:`, {
            format: imageData.format,
            width: imageData.width,
            height: imageData.height
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
    } else {
      processedData[key] = String(value || '');
    }
  }

  console.log('Processing document with data keys:', Object.keys(processedData));

  try {
    const doc = await handler.process(templateBuffer, processedData);
    console.log('Document processed successfully');
    return new Blob([doc], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
  } catch (error) {
    console.error('Error processing Word template:', error);
    throw new Error(`Document processing failed: ${error.message}`);
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
    console.log('Starting enhanced document generation with template ID:', templateId);
    console.log('Placeholder data:', placeholderData);
    
    // Get template info from database
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) {
      console.error('Template fetch error:', templateError);
      throw new Error(`Template fetch error: ${templateError.message}`);
    }
    if (!template) throw new Error('Template not found');

    console.log('Template found:', template.name, 'File path:', template.file_path);

    // Download template file from Supabase storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from('templates')
      .download(template.file_path);

    if (fileError) {
      console.error('Template download error:', fileError);
      throw new Error(`Template download error: ${fileError.message}`);
    }
    if (!fileData) throw new Error('Template file is empty');

    console.log('Template file downloaded successfully');
    
    const templateBuffer = await fileData.arrayBuffer();
    let resultBlob: Blob;

    // Process based on format
    switch (format) {
      case 'xlsx':
        console.log('Processing Excel document...');
        resultBlob = await handleExcel(templateBuffer, placeholderData);
        break;
      case 'docx':
      case 'pdf': // For now, handle PDF as DOCX
        console.log('Processing Word document...');
        resultBlob = await handleWord(templateBuffer, placeholderData);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    console.log('Document processed, blob size:', resultBlob.size);

    // Generate filename
    const baseFileName = templateName.replace(/\.[^/.]+$/, '');
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${baseFileName}_${timestamp}`;
    const fullFileName = `${fileName}.${format}`;

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

    // Convert placeholderData to JSON-compatible format
    const jsonPlaceholderData: Record<string, any> = {};
    Object.entries(placeholderData).forEach(([key, value]) => {
      jsonPlaceholderData[key] = typeof value === 'string' ? value : '[Image]';
    });

    // Save metadata to database
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
    await supabase
      .from('templates')
      .update({ 
        use_count: (template.use_count || 0) + 1 
      })
      .eq('id', templateId);

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: `${format.toUpperCase()} Generated`,
        resource_type: 'generated_file',
        resource_id: generatedFile.id,
        metadata: { 
          template_name: template.name,
          generated_name: fullFileName,
          placeholders_filled: Object.keys(placeholderData).length
        }
      });

    // Trigger download
    const url = window.URL.createObjectURL(resultBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fullFileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    console.log('Document generated, saved to Supabase, and download triggered successfully');

  } catch (error) {
    console.error('Error generating document:', error);
    throw error;
  }
};
