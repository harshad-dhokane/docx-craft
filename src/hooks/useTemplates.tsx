import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { Workbook } from 'exceljs';

const extractPlaceholders = async (file: File): Promise<string[]> => {
  const placeholders = new Set<string>();
  
  console.log('Extracting placeholders from file:', file.name, 'Type:', file.type);
  
  try {
    if (file.name.endsWith('.xlsx') || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      console.log('Processing Excel file...');
      const workbook = new Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);
      
      workbook.worksheets.forEach(worksheet => {
        console.log('Processing worksheet:', worksheet.name);
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (!row) return;
          
          row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            if (!cell || !cell.value) return;
            
            try {
              let cellText = '';
              
              // Handle different cell value types more safely
              if (typeof cell.value === 'string') {
                cellText = cell.value;
              } else if (typeof cell.value === 'number') {
                cellText = cell.value.toString();
              } else if (cell.value && typeof cell.value === 'object') {
                // Handle rich text, formulas, and other complex objects
                if ('text' in cell.value && cell.value.text) {
                  cellText = String(cell.value.text);
                } else if ('richText' in cell.value && Array.isArray(cell.value.richText)) {
                  cellText = cell.value.richText
                    .map((rt: any) => (rt && rt.text) ? String(rt.text) : '')
                    .join('');
                } else if ('result' in cell.value && cell.value.result !== null) {
                  cellText = String(cell.value.result);
                } else if ('formula' in cell.value && cell.value.formula) {
                  cellText = String(cell.value.formula);
                }
              }
              
              // Fallback to cell.text if available and cellText is still empty
              if (!cellText && cell.text) {
                cellText = String(cell.text);
              }
              
              // Extract placeholders using regex
              if (cellText) {
                const matches = cellText.match(/\{\{([^}]+)\}\}/g);
                if (matches) {
                  matches.forEach(match => {
                    const placeholder = match.replace(/[{}]/g, '').trim();
                    if (placeholder && placeholder.length > 0) {
                      placeholders.add(placeholder);
                      console.log('Found placeholder:', placeholder, 'at row', rowNumber, 'col', colNumber);
                    }
                  });
                }
              }
            } catch (cellError) {
              console.warn('Error processing cell at row', rowNumber, 'col', colNumber, ':', cellError);
              // Continue processing other cells
            }
          });
        });
      });
    } else if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('Processing Word file...');
      const arrayBuffer = await file.arrayBuffer();
      
      // Convert ArrayBuffer to Uint8Array for text extraction
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Try to extract text content - this is a simple approach
      // Convert bytes to string, ignoring non-text content
      let textContent = '';
      
      // Look for readable text patterns in the binary data
      for (let i = 0; i < uint8Array.length - 1; i++) {
        const byte = uint8Array[i];
        // Include printable ASCII characters and common Unicode ranges
        if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13) {
          textContent += String.fromCharCode(byte);
        } else if (byte === 0) {
          textContent += ' '; // Replace null bytes with spaces
        }
      }
      
      console.log('Extracted text content length:', textContent.length);
      
      // Extract placeholders using regex
      const matches = textContent.match(/\{\{([^}]+)\}\}/g);
      if (matches) {
        matches.forEach(match => {
          const placeholder = match.replace(/[{}]/g, '').trim();
          if (placeholder && placeholder.length > 0) {
            placeholders.add(placeholder);
            console.log('Found placeholder:', placeholder);
          }
        });
      }
    }
    
    const result = Array.from(placeholders);
    console.log('Final extracted placeholders:', result);
    return result;
    
  } catch (error) {
    console.error('Error extracting placeholders:', error);
    console.error('Error details:', error?.message || 'Unknown error');
    
    // Return empty array on error to prevent upload failure
    console.log('Returning empty placeholders array due to extraction error');
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
      
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', user.id)
        .order('upload_date', { ascending: false });

      if (error) {
        console.error('Error fetching templates:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('No user logged in');

      console.log('Starting template upload for file:', file.name);
      
      // Validate file type
      const isValidType = file.name.endsWith('.docx') || 
                         file.name.endsWith('.xlsx') ||
                         file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                         file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      
      if (!isValidType) {
        throw new Error('Invalid file type. Please upload a .docx or .xlsx file.');
      }
      
      // Extract placeholders with improved error handling
      let placeholders: string[] = [];
      try {
        console.log('Extracting placeholders...');
        placeholders = await extractPlaceholders(file);
        console.log('Successfully extracted placeholders:', placeholders);
      } catch (extractError) {
        console.error('Placeholder extraction failed:', extractError);
        // Continue with empty placeholders instead of failing
        placeholders = [];
        console.log('Continuing with empty placeholders due to extraction error');
      }

      // Upload file to Supabase storage
      console.log('Uploading file to storage...');
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('templates')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('File uploaded to storage:', uploadData.path);

      // Save template metadata to database
      console.log('Saving template metadata...');
      const { data: template, error: insertError } = await supabase
        .from('templates')
        .insert({
          name: file.name,
          user_id: user.id,
          file_path: uploadData.path,
          file_size: file.size,
          placeholders: placeholders
        })
        .select()
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
        // Try to clean up uploaded file
        await supabase.storage.from('templates').remove([uploadData.path]);
        throw new Error(`Database error: ${insertError.message}`);
      }

      console.log('Template metadata saved successfully:', template);
      return template;
    },
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      console.log('Template upload completed successfully:', template.name);
      toast({
        title: "Success",
        description: `Template "${template.name}" uploaded successfully!`,
      });
    },
    onError: (error) => {
      console.error('Upload failed:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload template. Please try again.",
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
