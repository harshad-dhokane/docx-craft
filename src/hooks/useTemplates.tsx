
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { Workbook } from 'exceljs';
import { TemplateHandler } from 'easy-template-x';

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
        worksheet.eachRow((row) => {
          row.eachCell({ includeEmpty: true }, (cell) => {
            // Safe check for cell value and text
            if (cell && cell.value !== null && cell.value !== undefined) {
              let cellText = '';
              
              // Handle different cell value types
              if (typeof cell.value === 'string') {
                cellText = cell.value;
              } else if (typeof cell.value === 'number') {
                cellText = cell.value.toString();
              } else if (cell.value && typeof cell.value === 'object' && 'text' in cell.value) {
                cellText = cell.value.text || '';
              } else if (cell.text) {
                cellText = cell.text;
              }
              
              if (cellText) {
                const matches = cellText.match(/\{\{([^}]+)\}\}/g);
                if (matches) {
                  matches.forEach(match => {
                    const placeholder = match.replace(/[{}]/g, '');
                    if (placeholder.trim()) {
                      placeholders.add(placeholder.trim());
                      console.log('Found placeholder:', placeholder.trim());
                    }
                  });
                }
              }
            }
          });
        });
      });
    } else if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('Processing Word file...');
      const arrayBuffer = await file.arrayBuffer();
      
      // Use easy-template-x to extract placeholders from DOCX
      const handler = new TemplateHandler();
      
      // Read the file content as text to extract placeholders
      const uint8Array = new Uint8Array(arrayBuffer);
      const textContent = new TextDecoder().decode(uint8Array);
      
      // Extract placeholders using regex
      const matches = textContent.match(/\{\{([^}]+)\}\}/g);
      if (matches) {
        matches.forEach(match => {
          const placeholder = match.replace(/[{}]/g, '');
          if (placeholder.trim()) {
            placeholders.add(placeholder.trim());
            console.log('Found placeholder:', placeholder.trim());
          }
        });
      }
    }
    
    const result = Array.from(placeholders);
    console.log('Extracted placeholders:', result);
    return result;
    
  } catch (error) {
    console.error('Error extracting placeholders:', error);
    // Return empty array instead of throwing to prevent upload failure
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
      
      // Extract placeholders
      const placeholders = await extractPlaceholders(file);
      console.log('Extracted placeholders:', placeholders);

      // Upload file to Supabase storage
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('templates')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded to storage:', uploadData.path);

      // Save template metadata to database
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
        throw insertError;
      }

      console.log('Template metadata saved to database:', template);
      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: "Success",
        description: "Template uploaded successfully!",
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
