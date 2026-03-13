import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ─── PUBLIC ENDPOINT (No Auth Required) ────────────────────
  @Get('track/:ticketNumber')
  async trackByTicket(
    @Param('ticketNumber') ticketNumber: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const accept = String(req.headers?.accept || '');

    // If opened directly in a browser, redirect to the Next.js tracking UI.
    if (accept.includes('text/html')) {
      const webBaseUrl =
        process.env.TRACKING_WEB_URL || 'http://localhost:3000';
      return res.redirect(
        `${webBaseUrl.replace(/\/$/, '')}/tracking/${encodeURIComponent(ticketNumber)}`,
      );
    }

    const result = await this.ordersService.findByTicketNumber(ticketNumber);
    return res.json(result);
  }

  // ─── PROTECTED ENDPOINTS ───────────────────────────────────
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CAJERO')
  create(@Body() createOrderDto: any, @CurrentUser() user: any) {
    createOrderDto.userId = user.id;
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CAJERO')
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CAJERO', 'COCINA')
  findActive() {
    return this.ordersService.findActive();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CAJERO', 'COCINA')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CAJERO', 'COCINA')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @CurrentUser() user: any,
  ) {
    return this.ordersService.updateStatus(id, body.status, user?.id);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CAJERO')
  cancel(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUser() user: any,
  ) {
    return this.ordersService.cancelOrder(id, body?.reason || null, user?.id);
  }
}
