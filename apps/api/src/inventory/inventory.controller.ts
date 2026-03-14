import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

type AuthUser = { id: string; role: string; email: string };

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  // ─── ITEMS (Insumos) ─────────────────────────────────

  @Post('items')
  createItem(@Body() dto: any) {
    return this.inventory.createItem(dto);
  }

  @Get('items')
  findAllItems(@Query('lowStock') lowStock?: string) {
    return this.inventory.findAllItems(lowStock === 'true');
  }

  @Get('items/:id')
  findOneItem(@Param('id') id: string) {
    return this.inventory.findOneItem(id);
  }

  @Put('items/:id')
  updateItem(@Param('id') id: string, @Body() dto: any) {
    return this.inventory.updateItem(id, dto);
  }

  @Delete('items/:id')
  deleteItem(@Param('id') id: string) {
    return this.inventory.deleteItem(id);
  }

  // ─── ALERTS ──────────────────────────────────────────

  @Get('alerts')
  getLowStockAlerts() {
    return this.inventory.getLowStockAlerts();
  }

  // ─── RECIPES ─────────────────────────────────────────

  @Post('recipes')
  createRecipe(@Body() dto: any) {
    return this.inventory.createRecipe(dto);
  }

  @Get('recipes')
  getRecipes(@Query('productId') productId?: string) {
    return this.inventory.getRecipes(productId);
  }

  @Put('recipes/:id')
  updateRecipe(@Param('id') id: string, @Body() dto: any) {
    return this.inventory.updateRecipeIngredient(id, dto);
  }

  @Delete('recipes/:id')
  deleteRecipe(@Param('id') id: string) {
    return this.inventory.deleteRecipeIngredient(id);
  }

  // ─── RESTOCK ─────────────────────────────────────────

  @Post('restock')
  restock(@Body() dto: any, @CurrentUser() user: AuthUser) {
    return this.inventory.restock({ ...dto, userId: user.id });
  }

  // ─── ADJUST ──────────────────────────────────────────

  @Post('adjust')
  adjust(@Body() dto: any, @CurrentUser() user: AuthUser) {
    return this.inventory.adjust({ ...dto, userId: user.id });
  }

  // ─── MOVEMENTS ───────────────────────────────────────

  @Get('movements')
  getMovements(
    @Query('inventoryItemId') inventoryItemId?: string,
    @Query('movementType') movementType?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventory.getMovements({
      inventoryItemId,
      movementType,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
