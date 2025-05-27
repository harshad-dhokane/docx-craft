
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Template {
  id: string;
  name: string;
  file_path: string;
  placeholders: string[];
  upload_date: string;
  file_size: number | null;
  use_count: number;
}

// Function to extract placeholders from DOCX content
const extractPlaceholders = async (file: File): Promise<string[]> => {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const zipFile = await zip.loadAsync(file);
    
    // Get document.xml which contains the main content
    const documentXml = await zipFile.file('word/document.xml')?.async('text');
    
    if (!documentXml) {
      return [];
    }
    
    // Extract placeholders using regex (looking for {{placeholder}} format)
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    const placeholders: string[] = [];
    let match;
    
    while ((match = placeholderRegex.exec(documentXml)) !== null) {
      const placeholder = match[1].trim();
      if (!placeholders.includes(placeholder)) {
        placeholders.push(placeholder);
      }
    }
    
    return placeholders;
  } catch (error) {
    console.error('Error extracting placeholders:', error);
    return [];
  }
};

export function useTemplates() {
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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', user?.id] });
      toast({
        title: "Template Uploaded",
        description: "Your template has been uploaded successfully.",
      });
    },
    onError: (error: any) => {
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
        .select('file_path')
        .eq('id', templateId)
        .single();

      if (template) {
        // Delete from storage
        await supabase.storage
          .from('templates')
          .remove([template.file_path]);
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
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generatePDFMutation = useMutation({
    mutationFn: async ({ templateId, placeholderData, pdfName }: {
      templateId: string;
      placeholderData: Record<string, string>;
      pdfName: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // For now, we'll create a simple PDF placeholder
      // In a real implementation, you would process the DOCX with the placeholder data
      const pdfContent = `PDF generated from template with data: ${JSON.stringify(placeholderData)}`;
      const pdfBlob = new Blob([pdfContent], { type: 'application/pdf' });
      
      const fileName = `${user.id}/${Date.now()}-${pdfName}.pdf`;

      // Upload PDF to storage
      const { error: uploadError } = await supabase.storage
        .from('generated-pdfs')
        .upload(fileName, pdfBlob);

      if (uploadError) throw uploadError;

      // Save PDF metadata
      const { data, error } = await supabase
        .from('generated_pdfs')
        .insert({
          user_id: user.id,
          template_id: templateId,
          name: pdfName,
          file_path: fileName,
          file_size: pdfBlob.size,
          placeholder_data: placeholderData,
        })
        .select()
        .single();

      if (error) throw error;

      // Update template use count manually since RPC might not be available
      const { data: template } = await supabase
        .from('templates')
        .select('use_count')
        .eq('id', templateId)
        .single();

      if (template) {
        await supabase
          .from('templates')
          .update({ use_count: (template.use_count || 0) + 1 })
          .eq('id', templateId);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['generated-pdfs', user?.id] });
      toast({
        title: "PDF Generated",
        description: "Your PDF has been generated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    templates,
    isLoading,
    uploadTemplate: uploadMutation.mutate,
    deleteTemplate: deleteMutation.mutate,
    generatePDF: generatePDFMutation.mutate,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isGenerating: generatePDFMutation.isPending,
  };
}
