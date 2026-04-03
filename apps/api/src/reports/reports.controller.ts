import { Controller, Get, Query, Res, UseGuards, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { DailySummaryService } from './daily-summary.service';
import { exportPDF } from './export-pdf';
import { exportExcel } from './export-excel';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly dailySummaryService: DailySummaryService,
  ) {}

  /* ─── Sales Today ────────────────────────────────────────── */
  @Get('sales/today')
  @Roles('ADMIN', 'CAJERO')
  salesToday() {
    return this.reportsService.salesToday();
  }

  /* ─── Sales by Date Range ────────────────────────────────── */
  @Get('sales')
  @Roles('ADMIN')
  salesByRange(@Query('from') from?: string, @Query('to') to?: string) {
    const { start, end } = this.parseDateRange(from, to);
    return this.reportsService.salesByRange(start, end);
  }

  /* ─── Sales by Category ──────────────────────────────────── */
  @Get('sales/by-category')
  @Roles('ADMIN')
  salesByCategory(@Query('from') from?: string, @Query('to') to?: string) {
    const { start, end } = this.parseDateRange(from, to);
    return this.reportsService.salesByCategory(start, end);
  }

  /* ─── Sales by Payment Method ────────────────────────────── */
  @Get('sales/by-payment-method')
  @Roles('ADMIN')
  salesByPaymentMethod(@Query('from') from?: string, @Query('to') to?: string) {
    const { start, end } = this.parseDateRange(from, to);
    return this.reportsService.salesByPaymentMethod(start, end);
  }

  /* ─── Sales by Order Type ────────────────────────────────── */
  @Get('sales/by-type')
  @Roles('ADMIN')
  salesByType(@Query('from') from?: string, @Query('to') to?: string) {
    const { start, end } = this.parseDateRange(from, to);
    return this.reportsService.salesByType(start, end);
  }

  /* ─── Top Products ───────────────────────────────────────── */
  @Get('top-products')
  @Roles('ADMIN')
  topProducts(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    const { start, end } = this.parseDateRange(from, to);
    const lim = Math.min(Math.max(parseInt(limit || '10', 10) || 10, 1), 50);
    return this.reportsService.topProducts(start, end, lim);
  }

  /* ─── Cancellations ──────────────────────────────────────── */
  @Get('cancellations')
  @Roles('ADMIN')
  cancellations(@Query('from') from?: string, @Query('to') to?: string) {
    const { start, end } = this.parseDateRange(from, to);
    return this.reportsService.cancellations(start, end);
  }

  /* ─── Daily Summaries ─────────────────────────────────────── */
  @Get('daily-summaries')
  @Roles('ADMIN')
  dailySummaries(@Query('from') from?: string, @Query('to') to?: string) {
    const { start, end } = this.parseDateRange(from, to);
    return this.dailySummaryService.getSummaries(
      start.toISOString(),
      end.toISOString(),
    );
  }

  /* ─── Export: Sales PDF ──────────────────────────────────── */
  @Get('export/sales/pdf')
  @Roles('ADMIN')
  async exportSalesPDF(
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const { start, end } = this.parseDateRange(from, to);
    const data = await this.reportsService.salesByRange(start, end);
    const rows = (data.daily || []).map((d: any) => ({
      date: d.date,
      totalSales: Number(d.totalSales ?? 0).toFixed(2),
      totalOrders: d.totalOrders,
      avgTicket: Number(d.avgTicket ?? 0).toFixed(2),
    }));

    exportPDF(res, {
      title: 'Reporte de Ventas',
      subtitle: `${start.toLocaleDateString('es-PE')} — ${end.toLocaleDateString('es-PE')}`,
      columns: [
        { header: 'Fecha', key: 'date', width: 120 },
        { header: 'Ventas (S/)', key: 'totalSales', width: 100 },
        { header: '# Pedidos', key: 'totalOrders', width: 80 },
        { header: 'Ticket Prom.', key: 'avgTicket', width: 100 },
      ],
      rows,
    });
  }

  /* ─── Export: Sales Excel ──────────────────────────────────── */
  @Get('export/sales/excel')
  @Roles('ADMIN')
  async exportSalesExcel(
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const { start, end } = this.parseDateRange(from, to);
    const data = await this.reportsService.salesByRange(start, end);
    const rows = (data.daily || []).map((d: any) => ({
      date: d.date,
      totalSales: Number(d.totalSales ?? 0),
      totalOrders: Number(d.totalOrders ?? 0),
      avgTicket: Number(d.avgTicket ?? 0),
    }));

    exportExcel(res, {
      title: 'Reporte_Ventas',
      sheetName: 'Ventas',
      columns: [
        { header: 'Fecha', key: 'date' },
        { header: 'Ventas (S/)', key: 'totalSales' },
        { header: '# Pedidos', key: 'totalOrders' },
        { header: 'Ticket Promedio', key: 'avgTicket' },
      ],
      rows,
    });
  }

  /* ─── Export: Top Products PDF ─────────────────────────────── */
  @Get('export/top-products/pdf')
  @Roles('ADMIN')
  async exportTopProductsPDF(
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const { start, end } = this.parseDateRange(from, to);
    const products = await this.reportsService.topProducts(start, end, 50);
    const rows = products.map((p: any) => ({
      productName: p.productName,
      totalQty: Number(p.totalQty ?? 0),
      totalRevenue: Number(p.totalRevenue ?? 0).toFixed(2),
    }));

    exportPDF(res, {
      title: 'Top Productos',
      subtitle: `${start.toLocaleDateString('es-PE')} — ${end.toLocaleDateString('es-PE')}`,
      columns: [
        { header: 'Producto', key: 'productName', width: 200 },
        { header: 'Cantidad', key: 'totalQty', width: 100 },
        { header: 'Ingresos (S/)', key: 'totalRevenue', width: 120 },
      ],
      rows,
    });
  }

  /* ─── Export: Top Products Excel ───────────────────────────── */
  @Get('export/top-products/excel')
  @Roles('ADMIN')
  async exportTopProductsExcel(
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const { start, end } = this.parseDateRange(from, to);
    const products = await this.reportsService.topProducts(start, end, 50);
    const rows = products.map((p: any) => ({
      productName: p.productName,
      totalQty: Number(p.totalQty ?? 0),
      totalRevenue: Number(p.totalRevenue ?? 0),
    }));

    exportExcel(res, {
      title: 'Top_Productos',
      sheetName: 'Productos',
      columns: [
        { header: 'Producto', key: 'productName' },
        { header: 'Cantidad', key: 'totalQty' },
        { header: 'Ingresos (S/)', key: 'totalRevenue' },
      ],
      rows,
    });
  }

  /* ─── Private: Parse Date Range ──────────────────────────── */
  private parseDateRange(from?: string, to?: string) {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (from) {
      start = new Date(from);
      if (isNaN(start.getTime()))
        throw new BadRequestException('Invalid "from" date');
      start.setHours(0, 0, 0, 0);
    } else {
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    }

    if (to) {
      end = new Date(to);
      if (isNaN(end.getTime()))
        throw new BadRequestException('Invalid "to" date');
      end.setHours(23, 59, 59, 999);
    } else {
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
    }

    const diffDays =
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 90)
      throw new BadRequestException('Date range cannot exceed 90 days');
    if (start > end)
      throw new BadRequestException('"from" must be before "to"');

    return { start, end };
  }
}
