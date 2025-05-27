
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
    mutationFn: async ({ file, placeholders }: { file: File; placeholders: string[] }) => {
      if (!user) throw new Error('User not authenticated');

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

  return {
    templates,
    isLoading,
    uploadTemplate: uploadMutation.mutate,
    deleteTemplate: deleteMutation.mutate,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
