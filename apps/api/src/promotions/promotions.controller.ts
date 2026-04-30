import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  /** Public (JWT only) — POS active combos */
  @Get()
  findActive() {
    return this.promotionsService.findActive();
  }

  /** Admin — all promotions regardless of status */
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('all')
  findAll() {
    return this.promotionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.promotionsService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() body: any) {
    return this.promotionsService.create(body);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.promotionsService.update(id, body);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/toggle')
  toggle(@Param('id') id: string) {
    return this.promotionsService.toggle(id);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promotionsService.remove(id);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post(':id/items')
  addItem(@Param('id') promotionId: string, @Body() body: any) {
    return this.promotionsService.addItem(promotionId, body);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete(':id/items/:itemId')
  removeItem(
    @Param('id') promotionId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.promotionsService.removeItem(promotionId, itemId);
  }
}
