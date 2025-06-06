import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { Workbook } from 'exceljs';
import { TemplateHandler } from 'easy-template-x';

const extractPlaceholders = async (file: File): Promise<string[]> => {
  const placeholders = new Set<string>();
  
  console.log('Starting placeholder extraction for file:', file.name, 'Type:', file.type, 'Size:', file.size);
  
  try {
    if (file.name.endsWith('.xlsx') || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      console.log('Processing Excel file...');
      
      try {
        const workbook = new Workbook();
        const arrayBuffer = await file.arrayBuffer();
        console.log('ArrayBuffer size:', arrayBuffer.byteLength);
        
        await workbook.xlsx.load(arrayBuffer);
        console.log('Excel workbook loaded successfully');
        
        workbook.worksheets.forEach((worksheet, wsIndex) => {
          console.log(`Processing worksheet ${wsIndex + 1}:`, worksheet.name);
          
          worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            try {
              if (!row || !row.values) return;
              
              // Convert row.values to array and process each cell
              const values = Array.isArray(row.values) ? row.values : [];
              
              values.forEach((cellValue, colIndex) => {
                if (!cellValue) return;
                
                try {
                  let cellText = '';
                  
                  // Handle different cell value types
                  if (typeof cellValue === 'string') {
                    cellText = cellValue;
                  } else if (typeof cellValue === 'number') {
                    cellText = cellValue.toString();
                  } else if (cellValue && typeof cellValue === 'object') {
                    // Handle Excel formula objects and rich text
                    if ('text' in cellValue && cellValue.text) {
                      cellText = String(cellValue.text);
                    } else if ('richText' in cellValue && Array.isArray(cellValue.richText)) {
                      cellText = cellValue.richText
                        .map((rt: any) => (rt && rt.text) ? String(rt.text) : '')
                        .join('');
                    } else if ('result' in cellValue && cellValue.result != null) {
                      cellText = String(cellValue.result);
                    } else if ('formula' in cellValue && cellValue.formula) {
                      cellText = String(cellValue.formula);
                    } else {
                      // Fallback: try to convert to string
                      cellText = String(cellValue);
                    }
                  }
                  
                  // Extract placeholders using regex
                  if (cellText && cellText.length > 0) {
                    const matches = cellText.match(/\{\{([^}]+)\}\}/g);
                    if (matches && matches.length > 0) {
                      matches.forEach(match => {
                        const placeholder = match.replace(/[{}]/g, '').trim();
                        if (placeholder && placeholder.length > 0) {
                          placeholders.add(placeholder);
                          console.log(`Found Excel placeholder: "${placeholder}" at row ${rowNumber}, col ${colIndex}`);
                        }
                      });
                    }
                  }
                } catch (cellError) {
                  console.warn(`Error processing cell at row ${rowNumber}, col ${colIndex}:`, cellError);
                  // Continue processing other cells
                }
              });
            } catch (rowError) {
              console.warn(`Error processing row ${rowNumber}:`, rowError);
              // Continue processing other rows
            }
          });
        });
        
        console.log(`Excel processing complete. Found ${placeholders.size} unique placeholders.`);
        
      } catch (excelError) {
        console.error('Error processing Excel file:', excelError);
        // Don't throw error, just log and return empty placeholders
        console.log('Continuing with empty placeholders due to Excel processing error');
      }
      
    } else if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('Processing Word file using easy-template-x...');
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        console.log('Word file ArrayBuffer size:', arrayBuffer.byteLength);
        
        // Use easy-template-x to parse tags
        const handler = new TemplateHandler();
        const tags = await handler.parseTags(arrayBuffer);
        
        console.log('Tags found by easy-template-x:', tags);
        
        // Extract placeholder names from tags
        if (tags && Array.isArray(tags)) {
          tags.forEach((tag: any) => {
            if (tag && tag.name && typeof tag.name === 'string') {
              const placeholder = tag.name.trim();
              if (placeholder && placeholder.length > 0) {
                placeholders.add(placeholder);
                console.log(`Found DOCX placeholder: "${placeholder}"`);
              }
            }
          });
        }
        
        console.log(`DOCX processing complete using easy-template-x. Found ${placeholders.size} unique placeholders.`);
        
      } catch (docxError) {
        console.error('Error processing DOCX file with easy-template-x:', docxError);
        
        // Fallback to basic text extraction if easy-template-x fails
        console.log('Falling back to basic text extraction...');
        try {
          const arrayBuffer = await file.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Enhanced text extraction for DOCX files
          let textContent = '';
          let consecutiveNulls = 0;
          
          for (let i = 0; i < uint8Array.length; i++) {
            const byte = uint8Array[i];
            
            if (byte === 0) {
              consecutiveNulls++;
              if (consecutiveNulls < 3) {
                textContent += ' '; // Replace single/double null bytes with spaces
              }
            } else {
              consecutiveNulls = 0;
              
              // Include printable ASCII characters and common Unicode ranges
              if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13 || byte === 9) {
                textContent += String.fromCharCode(byte);
              } else if (byte > 127) {
                // Handle UTF-8 encoded characters
                textContent += String.fromCharCode(byte);
              }
            }
          }
          
          console.log('Fallback text extraction complete. Length:', textContent.length);
          
          // Extract placeholders using regex
          const matches = textContent.match(/\{\{([^}]+)\}\}/g);
          if (matches && matches.length > 0) {
            matches.forEach(match => {
              const placeholder = match.replace(/[{}]/g, '').trim();
              if (placeholder && placeholder.length > 0) {
                placeholders.add(placeholder);
                console.log(`Found Word placeholder (fallback): "${placeholder}"`);
              }
            });
          }
          
          console.log(`Fallback processing complete. Found ${placeholders.size} unique placeholders.`);
        } catch (fallbackError) {
          console.error('Fallback text extraction also failed:', fallbackError);
        }
      }
    } else {
      console.warn('Unsupported file type:', file.type, file.name);
    }
    
    const result = Array.from(placeholders);
    console.log('Final extracted placeholders:', result);
    return result;
    
  } catch (error) {
    console.error('Critical error in placeholder extraction:', error);
    console.error('Error stack:', error?.stack);
    
    // Always return empty array instead of throwing to prevent upload failure
    console.log('Returning empty placeholders array due to critical error');
    return [];
  }
};

export const useTemplates = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      console.log('Fetching templates for user:', user.id);
      
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', user.id)
        .order('upload_date', { ascending: false });

      if (error) {
        console.error('Error fetching templates:', error);
        throw error;
      }

      console.log('Fetched templates:', data?.length || 0);
      return data || [];
    },
    enabled: !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) {
        console.error('Upload attempted without user authentication');
        throw new Error('No user logged in');
      }

      console.log('=== STARTING TEMPLATE UPLOAD ===');
      console.log('File details:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });
      console.log('User ID:', user.id);
      
      // Enhanced file type validation
      const isDocx = file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const isXlsx = file.name.endsWith('.xlsx') || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      
      if (!isDocx && !isXlsx) {
        console.error('Invalid file type detected:', file.type, file.name);
        throw new Error('Invalid file type. Please upload a .docx or .xlsx file.');
      }
      
      console.log('File type validation passed:', isDocx ? 'DOCX' : 'XLSX');
      
      // Extract placeholders with comprehensive error handling
      let placeholders: string[] = [];
      console.log('Starting placeholder extraction...');
      
      try {
        placeholders = await extractPlaceholders(file);
        console.log('Placeholder extraction completed successfully:', placeholders);
      } catch (extractError) {
        console.error('Placeholder extraction failed completely:', extractError);
        console.error('Extract error details:', extractError?.message);
        // Continue with empty placeholders instead of failing
        placeholders = [];
        console.log('Proceeding with empty placeholders due to extraction failure');
      }

      // Upload file to Supabase storage
      console.log('=== UPLOADING TO STORAGE ===');
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      console.log('Storage file path:', fileName);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('templates')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload failed:', uploadError);
        console.error('Upload error details:', {
          message: uploadError.message,
          name: uploadError.name
        });
        throw new Error(`File upload failed: ${uploadError.message}`);
      }

      console.log('File uploaded successfully to storage:', uploadData?.path);

      // Save template metadata to database
      console.log('=== SAVING TO DATABASE ===');
      const templateData = {
        name: file.name,
        user_id: user.id,
        file_path: uploadData.path,
        file_size: file.size,
        placeholders: placeholders,
        use_count: 0
      };
      
      console.log('Template data to insert:', templateData);
      
      const { data: template, error: insertError } = await supabase
        .from('templates')
        .insert(templateData)
        .select()
        .single();

      if (insertError) {
        console.error('Database insert failed:', insertError);
        console.error('Insert error details:', {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint
        });
        
        // Clean up uploaded file on database failure
        console.log('Cleaning up uploaded file due to database error...');
        try {
          await supabase.storage.from('templates').remove([uploadData.path]);
          console.log('File cleanup completed');
        } catch (cleanupError) {
          console.error('File cleanup failed:', cleanupError);
        }
        
        throw new Error(`Database error: ${insertError.message}`);
      }

      console.log('=== UPLOAD COMPLETED SUCCESSFULLY ===');
      console.log('Template saved:', template);
      return template;
    },
    onSuccess: (template) => {
      console.log('Upload mutation succeeded:', template.name);
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: "Success",
        description: `Template "${template.name}" uploaded successfully!`,
      });
    },
    onError: (error) => {
      console.error('Upload mutation failed:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
      toast({
        title: "Upload Failed",
        description: error?.message || "Failed to upload template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      if (!user) throw new Error('No user logged in');

      // First get the template to find the file path
      const { data: template, error: fetchError } = await supabase
        .from('templates')
        .select('file_path')
        .eq('id', templateId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching template:', fetchError);
        throw fetchError;
      }

      // First, delete all generated PDFs that reference this template
      const { error: deletePdfsError } = await supabase
        .from('generated_pdfs')
        .delete()
        .eq('template_id', templateId)
        .eq('user_id', user.id);

      if (deletePdfsError) {
        console.error('Error deleting related generated PDFs:', deletePdfsError);
        throw new Error(`Failed to delete related PDFs: ${deletePdfsError.message}`);
      }

      // Delete the file from storage
      const { error: storageError } = await supabase.storage
        .from('templates')
        .remove([template.file_path]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }

      // Delete the template record from database
      const { error: deleteError } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting template from database:', deleteError);
        throw deleteError;
      }

      return templateId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: "Success",
        description: "Template deleted successfully!",
      });
    },
    onError: (error) => {
      console.error('Delete failed:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete template. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    templates,
    isLoading,
    uploadTemplate: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    deleteTemplate: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};
