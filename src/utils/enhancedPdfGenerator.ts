import { Workbook } from 'exceljs';
import { TemplateHandler, MimeType } from 'easy-template-x';
import { Buffer } from 'buffer';
import { supabase } from '@/integrations/supabase/client';

interface ImageData {
  _type: 'image';
  source: Buffer;
  format: string;
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

const handleExcel = async (templateBuffer: ArrayBuffer, data: Record<string, PlaceholderValue>): Promise<Blob> => {
  const workbook = new Workbook();
  await workbook.xlsx.load(templateBuffer);
  
  workbook.worksheets.forEach(worksheet => {
    // Process content WITHOUT changing any formatting or dimensions
    worksheet.eachRow((row) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        if (typeof cell.text === 'string') {
          let finalText = cell.text;

          // Store ALL original cell properties
          const originalStyle = {
            font: cell.font ? { ...cell.font } : undefined,
            alignment: cell.alignment ? { ...cell.alignment } : undefined,
            border: cell.border ? { ...cell.border } : undefined,
            fill: cell.fill ? { ...cell.fill } : undefined,
            numFmt: cell.numFmt,
            protection: cell.protection ? { ...cell.protection } : undefined
          };

          // Replace placeholders only
          Object.entries(data).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            const textValue = typeof value === 'string' ? value : '[Image not supported in Excel]';
            finalText = finalText.replace(regex, textValue);
          });

          if (finalText !== cell.text) {
            // Update cell value while preserving ALL formatting
            cell.value = finalText;
            
            // Restore ALL original formatting exactly as it was
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

    // DO NOT modify column widths or row heights - keep original dimensions
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
};

const handleWord = async (templateBuffer: ArrayBuffer, data: Record<string, PlaceholderValue>): Promise<Blob> => {
  const handler = new TemplateHandler();
  
  // Process the data to handle images
  const processedData: Record<string, string | {
    _type: 'image';
    source: Buffer;
    format: string;
    width: number;
    height: number;
    altText?: string;
  }> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      if (value.startsWith('data:image')) {
        // Convert base64 image to binary
        const base64Data = value.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        processedData[key] = {
          _type: 'image',
          source: imageBuffer,
          format: MimeType.Png,
          width: 400,
          height: 300,
          altText: key
        };
      } else {
        processedData[key] = value;
      }
    }
  }

  try {
    const doc = await handler.process(new Blob([templateBuffer]), processedData);
    return new Blob([await doc.arrayBuffer()], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
  } catch (error) {
    console.error('Error processing Word template:', error);
    throw error;
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
    console.log('Starting enhanced PDF generation with template ID:', templateId);
    
    // Get template info from database
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) throw new Error(`Template fetch error: ${templateError.message}`);
    if (!template) throw new Error('Template not found');

    console.log('Template found:', template.name, 'File path:', template.file_path);

    // Download template file from Supabase storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from('templates')
      .download(template.file_path);

    if (fileError) throw new Error(`Template download error: ${fileError.message}`);
    if (!fileData) throw new Error('Template file is empty');

    console.log('Template file downloaded successfully');
    
    const templateBuffer = await fileData.arrayBuffer();
    let resultBlob: Blob;

    // Process based on format
    switch (format) {
      case 'xlsx':
        resultBlob = await handleExcel(templateBuffer, placeholderData);
        break;
      case 'docx':
      case 'pdf': // For now, handle PDF as DOCX
        resultBlob = await handleWord(templateBuffer, placeholderData);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    // Generate filename
    const baseFileName = templateName.replace(/\.[^/.]+$/, '');
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${baseFileName}_${timestamp}`;
    const fullFileName = `${fileName}.${format}`;

    // Upload to Supabase storage
    const storagePath = `${userId}/${Date.now()}-${fullFileName}`;
    const { error: uploadError } = await supabase.storage
      .from('generated-pdfs')
      .upload(storagePath, resultBlob);

    if (uploadError) throw new Error(`Storage upload error: ${uploadError.message}`);

    // Save metadata to database
    const { data: generatedFile, error: insertError } = await supabase
      .from('generated_pdfs')
      .insert({
        name: fullFileName,
        user_id: userId,
        template_id: templateId,
        file_path: storagePath,
        file_size: resultBlob.size,
        placeholder_data: placeholderData,
        generated_date: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) throw new Error(`Database insert error: ${insertError.message}`);

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
