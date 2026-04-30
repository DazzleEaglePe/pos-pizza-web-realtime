import PDFDocument from 'pdfkit';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

interface PDFColumn {
  header: string;
  key: string;
  width: number;
  align?: 'left' | 'center' | 'right';
}

interface PDFExportOptions {
  title: string;
  columns: PDFColumn[];
  rows: Record<string, unknown>[];
  subtitle?: string;
  business?: {
    companyName?: string;
    ruc?: string;
    address?: string;
    phone?: string;
    logoUrl?: string;
  };
}

export function exportPDF(res: Response, options: PDFExportOptions) {
  const { title, columns, rows, subtitle, business } = options;

  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${title.replace(/\s+/g, '_')}.pdf"`,
  );
  doc.pipe(res);

  const pageWidth = doc.page.width - 80;
  const startX = 40;

  // ── Business header ──
  let headerY = 40;

  if (business?.logoUrl) {
    const logoPath = business.logoUrl.startsWith('/')
      ? path.join(process.cwd(), business.logoUrl)
      : business.logoUrl;
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, startX, headerY, { width: 48, height: 48 });
    }
  }

  const textX = business?.logoUrl ? startX + 58 : startX;

  if (business?.companyName) {
    doc.fontSize(14).font('Helvetica-Bold').text(business.companyName, textX, headerY);
    headerY += 17;
  }

  const metaParts: string[] = [];
  if (business?.ruc) metaParts.push(`RUC: ${business.ruc}`);
  if (business?.address) metaParts.push(business.address);
  if (business?.phone) metaParts.push(business.phone);

  if (metaParts.length > 0) {
    doc.fontSize(7).font('Helvetica').text(metaParts.join('  ·  '), textX, headerY);
    headerY += 12;
  }

  // ── Separator line ──
  headerY = Math.max(headerY, business?.logoUrl ? 98 : headerY) + 6;
  doc.moveTo(startX, headerY).lineTo(startX + pageWidth, headerY).lineWidth(0.5).stroke('#999999');
  headerY += 14;

  // ── Title ──
  doc.fontSize(16).font('Helvetica-Bold').text(title, startX, headerY, { align: 'center', width: pageWidth });
  headerY += 20;

  if (subtitle) {
    doc.fontSize(9).font('Helvetica').fillColor('#666666').text(subtitle, startX, headerY, { align: 'center', width: pageWidth });
    doc.fillColor('#000000');
    headerY += 14;
  }

  headerY += 8;

  // ── Table header ──
  const tableWidth = columns.reduce((s, c) => s + c.width, 0);
  const rowHeight = 22;

  // Header background
  doc.rect(startX, headerY, tableWidth, rowHeight).fill('#222222');

  doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
  let x = startX;
  for (const col of columns) {
    doc.text(col.header.toUpperCase(), x + 6, headerY + 6, { width: col.width - 12, align: col.align || 'left' });
    x += col.width;
  }
  doc.fillColor('#000000');
  headerY += rowHeight;

  // ── Table rows ──
  doc.font('Helvetica').fontSize(8);
  let rowIndex = 0;

  for (const row of rows) {
    if (headerY > doc.page.height - 60) {
      addPageFooter(doc, title);
      doc.addPage();
      headerY = 40;
    }

    // Alternating row background
    if (rowIndex % 2 === 1) {
      doc.rect(startX, headerY, tableWidth, rowHeight).fill('#f5f5f5');
      doc.fillColor('#000000');
    }

    x = startX;
    for (const col of columns) {
      const val = row[col.key];
      const text = val != null ? String(val) : '';
      doc.text(text, x + 6, headerY + 6, { width: col.width - 12, align: col.align || 'left' });
      x += col.width;
    }
    headerY += rowHeight;
    rowIndex++;
  }

  // ── Summary line ──
  headerY += 4;
  doc.moveTo(startX, headerY).lineTo(startX + tableWidth, headerY).lineWidth(0.3).stroke('#cccccc');
  headerY += 8;
  doc.fontSize(7).font('Helvetica').fillColor('#666666');
  doc.text(`${rows.length} registro${rows.length !== 1 ? 's' : ''}`, startX, headerY);
  doc.fillColor('#000000');

  // ── Page footer ──
  addPageFooter(doc, title);

  doc.end();
}

function addPageFooter(doc: PDFKit.PDFDocument, title: string) {
  const pageBottom = doc.page.height - 25;
  doc.fontSize(7).font('Helvetica').fillColor('#999999');
  doc.text(
    `${title}  ·  Generado: ${new Date().toLocaleString('es-PE')}`,
    40,
    pageBottom,
    { align: 'center', width: doc.page.width - 80 },
  );
  doc.fillColor('#000000');
}
