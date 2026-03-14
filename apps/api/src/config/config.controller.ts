import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { BusinessConfigService } from './config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';

const LOGO_UPLOAD_DIR = join(process.cwd(), 'uploads', 'logos');

function ensureLogoDir() {
  if (!existsSync(LOGO_UPLOAD_DIR)) {
    mkdirSync(LOGO_UPLOAD_DIR, { recursive: true });
  }
}

function sanitizeFilenamePart(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
}

@Controller('config')
export class BusinessConfigController {
  constructor(private readonly configService: BusinessConfigService) {}

  @Get()
  async getPublicConfig() {
    const taxRate = await this.configService.getTaxRatePercent();
    return { taxRate };
  }

  @Get('full')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getFullConfig() {
    return this.configService.getConfig();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateConfig(
    @Body()
    body: Partial<{
      companyName: string;
      ruc: string | null;
      address: string | null;
      phone: string | null;
      email: string | null;
      taxRateDefault: number;
      currency: string;
      timezone: string;
      ticketHeader: string | null;
      ticketFooter: string | null;
      trackingBaseUrl: string | null;
      trackingExpiryHours: number;
      logoUrl: string | null;
    }>,
  ) {
    return this.configService.updateConfig(body);
  }

  @Post('logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          ensureLogoDir();
          cb(null, LOGO_UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const extension = extname(file.originalname || '').toLowerCase();
          const baseName = sanitizeFilenamePart(
            file.originalname?.replace(extension, '') || 'logo',
          );
          cb(null, `${Date.now()}-${baseName || 'logo'}${extension || '.png'}`);
        },
      }),
      limits: {
        fileSize: 4 * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        const allowedMime = [
          'image/png',
          'image/jpeg',
          'image/webp',
          'image/svg+xml',
        ];

        if (!allowedMime.includes(file.mimetype)) {
          cb(new BadRequestException('LOGO_INVALID_MIME'), false);
          return;
        }

        cb(null, true);
      },
    }),
  )
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('LOGO_FILE_REQUIRED');
    }

    const relativeUrl = `/uploads/logos/${file.filename}`;
    const updated = await this.configService.updateConfig({ logoUrl: relativeUrl });

    return {
      logoUrl: updated.logoUrl,
    };
  }
}
