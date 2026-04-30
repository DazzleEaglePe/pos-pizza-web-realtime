import * as XLSX from 'xlsx';
import { Response } from 'express';

interface ExcelColumn {
  header: string;
  key: string;
}

interface ExcelExportOptions {
  title: string;
  columns: ExcelColumn[];
  rows: Record<string, unknown>[];
  sheetName?: string;
}

export function exportExcel(res: Response, options: ExcelExportOptions) {
  const { title, columns, rows, sheetName } = options;

  const headers = columns.map((c) => c.header);
  const data = rows.map((row) => columns.map((c) => row[c.key] ?? ''));

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // Auto-size columns
  ws['!cols'] = columns.map((_, i) => {
    const maxLen = Math.max(
      headers[i].length,
      ...data.map((r) => String(r[i] ?? '').length),
    );
    return { wch: Math.min(maxLen + 2, 40) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Reporte');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${title.replace(/\s+/g, '_')}.xlsx"`,
  );
  res.send(buffer);
}
