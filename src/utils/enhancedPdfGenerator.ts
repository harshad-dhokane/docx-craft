
import jsPDF from 'jspdf';

interface PDFGenerationOptions {
  templateName: string;
  placeholderData: Record<string, string>;
  placeholders: string[];
}

export const generateEnhancedPDF = ({ templateName, placeholderData, placeholders }: PDFGenerationOptions): Blob => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Page dimensions
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPosition = margin;
  const lineHeight = 7;
  const sectionSpacing = 10;

  // Helper function to add new page if needed
  const checkPageOverflow = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
  };

  // Document Header
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  const headerText = templateName.replace('.docx', '').toUpperCase();
  const headerWidth = pdf.getTextWidth(headerText);
  pdf.text(headerText, (pageWidth - headerWidth) / 2, yPosition);
  
  yPosition += lineHeight * 2;
  
  // Add underline
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += sectionSpacing;

  // Document date
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const dateText = `Generated on: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`;
  const dateWidth = pdf.getTextWidth(dateText);
  pdf.text(dateText, pageWidth - margin - dateWidth, yPosition);
  yPosition += sectionSpacing * 2;

  // Introduction
  checkPageOverflow(lineHeight * 3);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  const introLines = [
    'Dear Recipient,',
    '',
    `This document has been generated using the template "${templateName}".`,
    'Please find below the information that has been filled in according to your requirements:'
  ];

  introLines.forEach(line => {
    if (line === '') {
      yPosition += lineHeight / 2;
    } else {
      checkPageOverflow(lineHeight);
      pdf.text(line, margin, yPosition);
      yPosition += lineHeight;
    }
  });

  yPosition += sectionSpacing;

  // Fields Section
  if (placeholders.length > 0) {
    checkPageOverflow(lineHeight * 2);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Document Information', margin, yPosition);
    yPosition += lineHeight * 1.5;

    // Add line under section header
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPosition, margin + 60, yPosition);
    yPosition += sectionSpacing;

    placeholders.forEach((placeholder, index) => {
      const value = placeholderData[placeholder] || 'Not provided';
      const isImage = value.startsWith('[Image:');
      
      checkPageOverflow(lineHeight * 3);

      // Field label
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      const fieldLabel = placeholder.replace(/[_-]/g, ' ').toUpperCase() + ':';
      pdf.text(fieldLabel, margin, yPosition);
      yPosition += lineHeight;

      // Field value
      pdf.setFont('helvetica', 'normal');
      if (isImage) {
        pdf.setTextColor(100, 100, 100);
        const imageInfo = value.match(/\[Image: (.+?) - (\d+)x(\d+)px\]/);
        if (imageInfo) {
          const [, filename, width, height] = imageInfo;
          pdf.text(`📷 Image: ${filename}`, margin + 5, yPosition);
          yPosition += lineHeight * 0.8;
          pdf.setFontSize(9);
          pdf.text(`   Dimensions: ${width} × ${height} pixels`, margin + 5, yPosition);
        } else {
          pdf.text(value, margin + 5, yPosition);
        }
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(11);
      } else {
        // Handle long text with word wrapping
        const wrappedText = pdf.splitTextToSize(value, contentWidth - 10);
        pdf.text(wrappedText, margin + 5, yPosition);
        yPosition += (wrappedText.length * lineHeight * 0.8);
      }

      yPosition += sectionSpacing;

      // Add separator line between fields
      if (index < placeholders.length - 1) {
        pdf.setLineWidth(0.1);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin + 5, yPosition - 3, pageWidth - margin - 5, yPosition - 3);
      }
    });
  }

  // Closing section
  yPosition += sectionSpacing;
  checkPageOverflow(lineHeight * 6);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  const closingLines = [
    '',
    'Thank you for your attention to this matter. Should you require any clarification',
    'or additional information, please do not hesitate to contact us.',
    '',
    'Best regards,',
    ''
  ];

  closingLines.forEach(line => {
    if (line === '') {
      yPosition += lineHeight;
    } else {
      checkPageOverflow(lineHeight);
      pdf.text(line, margin, yPosition);
      yPosition += lineHeight;
    }
  });

  // Signature line
  yPosition += lineHeight * 2;
  checkPageOverflow(lineHeight * 3);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, margin + 60, yPosition);
  yPosition += lineHeight;
  pdf.setFontSize(10);
  pdf.text('Authorized Signature', margin, yPosition);

  // Footer
  const footerY = pageHeight - 15;
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  const footerText = 'Generated by DocCraft • Document Management System';
  const footerWidth = pdf.getTextWidth(footerText);
  pdf.text(footerText, (pageWidth - footerWidth) / 2, footerY);

  return pdf.output('blob');
};
