import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { TrackingService } from './tracking.service';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  /**
   * GET /tracking/:code — Public endpoint.
   * Returns order status by tracking code.
   * If accessed from a browser, redirects to the Next.js tracking UI.
   */
  @Get(':code')
  async findByCode(
    @Param('code') code: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const accept = String(req.headers?.accept || '');

    // Browser redirect to Next.js
    if (accept.includes('text/html')) {
      const webBaseUrl =
        process.env.TRACKING_WEB_URL || 'http://localhost:3000';

      // Look up the tracking record to get the ticket number
      try {
        const data = await this.trackingService.findByCode(code);
        return res.redirect(
          `${webBaseUrl.replace(/\/$/, '')}/tracking/${encodeURIComponent(data.ticketNumber)}`,
        );
      } catch {
        return res.redirect(`${webBaseUrl.replace(/\/$/, '')}/tracking`);
      }
    }

    const result = await this.trackingService.findByCode(code);
    return res.json(result);
  }
}
