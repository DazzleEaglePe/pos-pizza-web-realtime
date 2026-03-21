import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface PDFColumn {
  header: string;
  key: string;
  width: number;
}

interface PDFExportOptions {
  title: string;
  columns: PDFColumn[];
  rows: Record<string, unknown>[];
  subtitle?: string;
}

export function exportPDF(res: Response, options: PDFExportOptions) {
  const { title, columns, rows, subtitle } = options;

  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${title.replace(/\s+/g, '_')}.pdf"`,
  );
  doc.pipe(res);

  // Title
  doc.fontSize(18).text(title, { align: 'center' });
  if (subtitle) {
    doc.fontSize(10).text(subtitle, { align: 'center' });
  }
  doc.moveDown(1);

  // Table header
  const startX = 40;
  let currentY = doc.y;
  const rowHeight = 20;

  doc.fontSize(9).font('Helvetica-Bold');
  let x = startX;
  for (const col of columns) {
    doc.text(col.header, x, currentY, { width: col.width, align: 'left' });
    x += col.width;
  }

  currentY += rowHeight;
  doc
    .moveTo(startX, currentY)
    .lineTo(startX + columns.reduce((s, c) => s + c.width, 0), currentY)
    .stroke();
  currentY += 5;

  // Table rows
  doc.font('Helvetica').fontSize(8);
  for (const row of rows) {
    if (currentY > doc.page.height - 60) {
      doc.addPage();
      currentY = 40;
    }

    x = startX;
    for (const col of columns) {
      const val = row[col.key];
      const text = val != null ? String(val) : '';
      doc.text(text, x, currentY, { width: col.width, align: 'left' });
      x += col.width;
    }
    currentY += rowHeight;
  }

  // Footer
  doc
    .fontSize(7)
    .text(
      `Generado: ${new Date().toLocaleString('es-PE')}`,
      40,
      doc.page.height - 30,
      { align: 'right' },
    );

  doc.end();
}
