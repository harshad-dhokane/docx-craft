
export const convertToPdfOnServer = async (file: File): Promise<Blob> => {
  const formData = new FormData();
  formData.append('file', file);

  console.log('Sending file to server for PDF conversion:', file.name);

  const response = await fetch('/api/convert-to-pdf', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('Server PDF conversion failed:', error);
    throw new Error(error.error || 'PDF conversion failed on server');
  }

  const pdfBlob = await response.blob();
  console.log('PDF conversion successful, received blob size:', pdfBlob.size);
  
  return pdfBlob;
};

export const checkServerHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    return response.ok && data.status === 'ok';
  } catch (error) {
    console.error('Server health check failed:', error);
    return false;
  }
};
