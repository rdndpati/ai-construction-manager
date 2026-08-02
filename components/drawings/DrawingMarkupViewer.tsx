"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc =
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
type Props = {
  fileUrl: string;
};

export default function DrawingMarkupViewer({ fileUrl }: Props) {
  const [numPages, setNumPages] = useState(0);

  return (
    <div className="w-full bg-gray-100 rounded-lg p-4 overflow-auto h-[900px]">

      <Document
        file={fileUrl}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={<p>Loading drawing...</p>}
        error={<p>Failed to load PDF.</p>}
      >
        {Array.from(new Array(numPages), (_, index) => (
          <div key={index} className="mb-8 flex justify-center">
            <Page
              pageNumber={index + 1}
              width={1000}
            />
          </div>
        ))}
      </Document>

    </div>
  );
}