import React from 'react';

interface PdfViewerProps {
  uri: string;
  style?: React.CSSProperties;
}

// If you want to use react-pdf, install it and uncomment the below:
// import { Document, Page, pdfjs } from 'react-pdf';
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const PdfViewer: React.FC<PdfViewerProps> = ({ uri, style }) => {
  // Uncomment this block and install react-pdf for real PDF rendering on web:
  // return (
  //   <div style={{ width: '100%', ...style }}>
  //     <Document file={uri}>
  //       <Page pageNumber={1} />
  //     </Document>
  //   </div>
  // );

  // Fallback message for now:
  return (
    <div style={{ padding: 16, textAlign: 'center', ...style }}>
      <p>PDF viewing is not available in the web version of this app.<br />
      Please download and open the PDF file manually, or use the mobile app for inline viewing.</p>
      <a href={uri} target="_blank" rel="noopener noreferrer">Download PDF</a>
    </div>
  );
};

export default PdfViewer;
