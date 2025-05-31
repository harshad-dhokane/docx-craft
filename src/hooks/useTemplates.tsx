import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useActivity } from './useActivity';
import { useToast } from '@/hooks/use-toast';
import { TemplateHandler, MimeType } from 'easy-template-x';
import * as Excel from 'exceljs';
import { Buffer } from 'buffer';
import { PostgrestError } from '@supabase/supabase-js';

export interface Template {
  id: string;
  name: string;
  file_path: string;
  placeholders: string[];
  upload_date: string;
  file_size: number | null;
  use_count: number;
}

// Function to extract placeholders from DOCX and Excel files
const extractPlaceholders = async (file: File): Promise<string[]> => {
  try {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const uniquePlaceholders = new Set<string>();
    
    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const workbook = new Excel.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);
      
      workbook.worksheets.forEach(worksheet => {
        worksheet.eachRow((row, rowNumber) => {
          row.eachCell((cell, colNumber) => {
            if (cell.text) {
              const matches = cell.text.match(/{{([^{}]+)}}/g);
              if (matches) {
                matches.forEach(match => {
                  const placeholder = match.slice(2, -2).trim();
                  uniquePlaceholders.add(placeholder);
                });
              }
            }
          });
        });
      });
    } else if (fileExtension === 'docx') {
      const { TemplateHandler } = await import('easy-template-x');
      const buffer = await file.arrayBuffer();
      const handler = new TemplateHandler();
      const tags = await handler.parseTags(buffer);
      
      for (const tag of tags) {
        console.log('Found placeholder:', tag.name);
        uniquePlaceholders.add(tag.name);
      }
    }
    
    if (uniquePlaceholders.size === 0) {
      throw new Error('No placeholders found in template. Make sure your template has placeholders in the format {{placeholder}}');
    }
    
    return Array.from(uniquePlaceholders);
  } catch (error) {
    console.error('Error extracting placeholders:', error);
    throw error;
  }
};

export function useTemplates() {
  const { user } = useAuth();
  const { logActivity } = useActivity();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', user.id)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      return data as Template[];
    },
    enabled: !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('User not authenticated');

      // Extract placeholders from the DOCX file
      const placeholders = await extractPlaceholders(file);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('templates')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save template metadata
      const { data, error } = await supabase
        .from('templates')
        .insert({
          user_id: user.id,
          name: file.name,
          file_path: fileName,
          placeholders: placeholders,
          file_size: file.size,
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      logActivity({
        action: 'Template Uploaded',
        resource_type: 'template',
        resource_id: data.id,
        metadata: { name: file.name, placeholders: placeholders.length }
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', user?.id] });
      toast({
        title: "Template Uploaded",
        description: "Your template has been uploaded successfully.",
      });
    },
    onError: (error: Error | PostgrestError) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      if (!user) throw new Error('User not authenticated');

      // Get template info
      const { data: template } = await supabase
        .from('templates')
        .select('file_path, name')
        .eq('id', templateId)
        .single();

      if (template) {
        // Delete from storage
        await supabase.storage
          .from('templates')
          .remove([template.file_path]);

        // Log activity
        logActivity({
          action: 'Template Deleted',
          resource_type: 'template',
          resource_id: templateId,
          metadata: { name: template.name }
        });
      }

      // Delete from database
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', user?.id] });
      toast({
        title: "Template Deleted",
        description: "Template has been deleted successfully.",
      });
    },
    onError: (error: Error | PostgrestError) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  interface ImageContent {
    _type: 'image';
    source: string;
    width?: number;
    height?: number;
    altText?: string;
    extension?: string;
    format?: string;
  }

  type TemplateContent = string | ImageContent;

  interface ProcessedImageData {
    _type: 'image';
    source: string;
    extension: string;
    altText: string;
  }

  type ProcessedValue = string | ProcessedImageData;

  const generatePDFMutation = useMutation({
    mutationFn: async ({ templateId, placeholderData, pdfName }: {
      templateId: string;
      placeholderData: Record<string, string | { _type: string; source: string; altText?: string; transparencyPercent?: number }>;
      pdfName: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      try {
        console.log('Starting document generation with:', { templateId, pdfName });
        
        // Get template info
        const { data: template, error: templateError } = await supabase
          .from('templates')
          .select('*')
          .eq('id', templateId)
          .single();

        if (templateError) throw new Error(`Template fetch error: ${templateError.message}`);
        if (!template) throw new Error('Template not found');

        console.log('Template found:', template.name);

        // Get template file from storage
        const { data: fileData, error: fileError } = await supabase.storage
          .from('templates')
          .download(template.file_path);

        if (fileError) throw new Error(`Template download error: ${fileError.message}`);
        if (!fileData) throw new Error('Template file is empty');

        const fileExtension = template.name.split('.').pop()?.toLowerCase();
        const timestamp = new Date().getTime();
        let fileName: string;
        let fileBuffer: ArrayBuffer;

        // Process document with format preservation
        try {
          if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            const workbook = new Excel.Workbook();
            await workbook.xlsx.load(await fileData.arrayBuffer());
            
            // Process Excel with formatting preservation
            for (const worksheet of workbook.worksheets) {
              // First pass: Calculate optimal column widths based on content
              const columnWidths: { [key: number]: number } = {};
              
              worksheet.eachRow({ includeEmpty: true }, (row) => {
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                  const content = cell.text || '';
                  const contentWidth = content.length * 1.2;
                  columnWidths[colNumber] = Math.max(columnWidths[colNumber] || 0, contentWidth);
                });
              });

              // Apply calculated column widths
              Object.entries(columnWidths).forEach(([col, width]) => {
                const column = worksheet.getColumn(parseInt(col));
                column.width = Math.min(Math.max(width, 10), 50); // Min 10, max 50
              });

              // Process content with format preservation
              worksheet.eachRow((row) => {
                row.eachCell({ includeEmpty: true }, (cell) => {
                  if (typeof cell.text === 'string') {
                    const matches = cell.text.match(/{{([^{}]+)}}/g);
                    if (matches) {
                      let finalText = cell.text;
                      const originalStyle = {
                        font: cell.font ? { ...cell.font } : undefined,
                        alignment: cell.alignment ? { ...cell.alignment } : undefined,
                        border: cell.border ? { ...cell.border } : undefined,
                        fill: cell.fill ? { ...cell.fill } : undefined,
                        numFmt: cell.numFmt,
                        protection: cell.protection ? { ...cell.protection } : undefined
                      };

                      matches.forEach(match => {
                        const placeholder = match.slice(2, -2);
                        const value = placeholderData[placeholder];
                        finalText = finalText.replace(match, String(value || ''));
                      });

                      // Adjust row height based on content length
                      const lines = finalText.split('\n');
                      const currentColumn = worksheet.getColumn(cell.col);
                      const estimatedHeight = Math.max(
                        row.height || 15,
                        lines.length * 15,
                        (finalText.length / (currentColumn?.width || 10)) * 15
                      );
                      row.height = estimatedHeight;

                      // Update cell value while preserving formatting
                      cell.value = finalText;
                      
                      // Restore original formatting
                      if (originalStyle.font) cell.font = originalStyle.font;
                      if (originalStyle.alignment) {
                        cell.alignment = {
                          ...originalStyle.alignment,
                          wrapText: true,
                          vertical: 'middle'
                        };
                      }
                      if (originalStyle.border) cell.border = originalStyle.border;
                      if (originalStyle.fill) cell.fill = originalStyle.fill;
                      if (originalStyle.numFmt) cell.numFmt = originalStyle.numFmt;
                      if (originalStyle.protection) cell.protection = originalStyle.protection;
                    }
                  }
                });
              });
            }
            
            fileBuffer = await workbook.xlsx.writeBuffer();
            fileName = `${user.id}/${timestamp}-${pdfName}.xlsx`;
          } else if (fileExtension === 'docx') {
            // Process DOCX with full formatting preservation
            const buffer = await fileData.arrayBuffer();
            
            console.log('Processing DOCX document...');
            const handler = new TemplateHandler();

            type DocxImageData = {
              _type: 'image';
              source: Buffer;
              format: typeof MimeType.Png;
              altText: string;
            };

            type DocxTemplateData = string | DocxImageData;
            
            // Create a clean copy of placeholder data with proper typing
            const processedData: Record<string, DocxTemplateData> = {};
            
            // Process each placeholder
            Object.entries(placeholderData).forEach(([key, value]) => {
              if (value && typeof value === 'object' && 'source' in value && '_type' in value) {
                const imgValue = value as { _type: string; source: string; altText?: string };
                if (typeof imgValue.source === 'string' && imgValue.source.startsWith('data:image/')) {
                  const base64Data = imgValue.source.substring(imgValue.source.indexOf(',') + 1);
                  processedData[key] = {
                    _type: 'image',
                    source: Buffer.from(base64Data, 'base64'),
                    format: MimeType.Png,
                    altText: imgValue.altText || key
                  };
                }
              } else {
                processedData[key] = String(value || '');
              }
            });

            try {
              console.log('Processing document with data:', Object.keys(processedData));
              fileBuffer = await handler.process(buffer, processedData);
              fileName = `${user.id}/${timestamp}-${pdfName}.docx`;
              console.log('DOCX processing completed successfully');
            } catch (error) {
              console.error('Error during document processing:', error);
              throw new Error(`Document processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          } else {
            throw new Error(`Unsupported file type: ${fileExtension}`);
          }
        } catch (processError) {
          console.error('Document processing error:', processError);
          throw new Error(`Failed to process document: ${processError.message}`);
        }

        if (!fileBuffer) {
          throw new Error('Generated file buffer is empty');
        }

        console.log('Uploading generated file...');

        // Upload processed file
        const { error: uploadError } = await supabase.storage
          .from('generated-pdfs')
          .upload(fileName, new Blob([fileBuffer], {
            type: fileExtension === 'xlsx' 
              ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          }));

        if (uploadError) throw new Error(`Generated file upload error: ${uploadError.message}`);

        console.log('File uploaded successfully, saving metadata...');

        // Save metadata
        const { data: generatedFile, error: insertError } = await supabase
          .from('generated_pdfs')
          .insert({
            name: pdfName,
            user_id: user.id,
            template_id: templateId,
            file_path: fileName,
            file_size: fileBuffer.byteLength,
            placeholder_data: placeholderData,
            generated_date: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Update template use count
        await supabase
          .from('templates')
          .update({ 
            use_count: (template.use_count || 0) + 1 
          })
          .eq('id', templateId);

        logActivity({
          action: fileExtension === 'xlsx' ? 'Excel Generated' : 'DOCX Generated',
          resource_type: 'generated_file',
          resource_id: generatedFile.id,
          metadata: { 
            template_name: template.name,
            generated_name: pdfName,
            placeholders_filled: Object.keys(placeholderData).length
          }
        });

        return generatedFile;
      } catch (error) {
        console.error('Generation error:', error);
        throw error;
      }
    },
    onError: (error: Error | PostgrestError) => {
      console.error('Generation mutation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || 'Failed to generate document. Please try again.',
        variant: "destructive",
      });
    },
  });

  const downloadGeneratedFile = async (fileId: string, type: 'excel' | 'docx' | 'pdf') => {
    if (!user) throw new Error('User not authenticated');

    try {
      console.log('Starting download for file:', fileId, 'type:', type);
      
      // Get file info
      const { data: fileData, error: fetchError } = await supabase
        .from('generated_pdfs')
        .select('*')
        .eq('id', fileId)
        .single();

      if (fetchError) throw new Error(`Failed to fetch file info: ${fetchError.message}`);
      if (!fileData) throw new Error('File not found');

      const filePath = fileData.file_path;
      if (!filePath) throw new Error('File path not found');

      const fileExtension = filePath.split('.').pop()?.toLowerCase();
      console.log('File extension:', fileExtension);

      // Validate file type matches the actual file
      if (
        (type === 'excel' && !['xlsx', 'xls'].includes(fileExtension || '')) ||
        (type === 'docx' && fileExtension !== 'docx') ||
        (type === 'pdf' && fileExtension !== 'pdf')
      ) {
        throw new Error(`File is not in ${type} format`);
      }

      console.log('Downloading file from path:', filePath);

      // Download the file
      const { data, error: downloadError } = await supabase.storage
        .from('generated-pdfs')
        .download(filePath);

      if (downloadError) throw new Error(`Failed to download file: ${downloadError.message}`);
      if (!data) throw new Error('Downloaded file is empty');

      // Create download link
      const url = window.URL.createObjectURL(new Blob([data], { 
        type: type === 'pdf' 
          ? 'application/pdf' 
          : type === 'excel' 
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }));
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileData.name + (type === 'pdf' ? '.pdf' : type === 'excel' ? '.xlsx' : '.docx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      logActivity({
        action: `File Downloaded`,
        resource_type: 'generated_file',
        resource_id: fileId,
        metadata: { 
          name: fileData.name,
          type: type
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : 'Failed to download file',
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    templates,
    isLoading,
    uploadTemplate: uploadMutation.mutate,
    deleteTemplate: deleteMutation.mutate,
    generatePDF: generatePDFMutation.mutate,
    downloadGeneratedFile,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isGenerating: generatePDFMutation.isPending,
  };
}
