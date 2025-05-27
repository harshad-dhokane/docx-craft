
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface GeneratedPDF {
  id: string;
  name: string;
  file_path: string;
  template_id: string;
  generated_date: string;
  file_size: number | null;
  placeholder_data: Record<string, any>;
  template_name?: string;
}

export function useGeneratedPDFs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: generatedPDFs = [], isLoading } = useQuery({
    queryKey: ['generated-pdfs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('generated_pdfs')
        .select(`
          *,
          templates!inner(name)
        `)
        .eq('user_id', user.id)
        .order('generated_date', { ascending: false });

      if (error) throw error;
      
      return data.map(pdf => ({
        ...pdf,
        template_name: pdf.templates?.name || 'Unknown Template'
      })) as GeneratedPDF[];
    },
    enabled: !!user,
  });

  const downloadPDF = async (pdfId: string) => {
    const pdf = generatedPDFs.find(p => p.id === pdfId);
    if (!pdf) return;

    try {
      const { data, error } = await supabase.storage
        .from('generated-pdfs')
        .download(pdf.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdf.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (pdfId: string) => {
      if (!user) throw new Error('User not authenticated');

      const pdf = generatedPDFs.find(p => p.id === pdfId);
      if (pdf) {
        // Delete from storage
        await supabase.storage
          .from('generated-pdfs')
          .remove([pdf.file_path]);
      }

      // Delete from database
      const { error } = await supabase
        .from('generated_pdfs')
        .delete()
        .eq('id', pdfId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-pdfs', user?.id] });
      toast({
        title: "PDF Deleted",
        description: "PDF has been deleted successfully.",
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
    generatedPDFs,
    isLoading,
    downloadPDF,
    deletePDF: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
