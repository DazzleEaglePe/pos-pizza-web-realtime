import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  async findAll() {
    return await this.catalogService.findAll();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async findAllAdmin() {
    return await this.catalogService.findAllAdmin();
  }

  @Get('modifier-groups')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async findModifierGroupsAdmin() {
    return await this.catalogService.findModifierGroupsAdmin();
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.catalogService.findOne(id);
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createCategory(
    @Body()
    body: {
      name: string;
      icon?: string | null;
      description?: string | null;
      displayOrder?: number;
      isActive?: boolean;
    },
  ) {
    return this.catalogService.createCategory(body);
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateCategory(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      icon?: string | null;
      description?: string | null;
      displayOrder?: number;
      isActive?: boolean;
    },
  ) {
    return this.catalogService.updateCategory(id, body);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteCategory(@Param('id') id: string) {
    return this.catalogService.deleteCategory(id);
  }

  @Post('products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createProduct(
    @Body()
    body: {
      categoryId: string;
      name: string;
      description?: string | null;
      basePrice: number;
      imageUrl?: string | null;
      hasVariants?: boolean;
      displayOrder?: number;
      isActive?: boolean;
    },
  ) {
    return this.catalogService.createProduct(body);
  }

  @Patch('products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateProduct(
    @Param('id') id: string,
    @Body()
    body: {
      categoryId?: string;
      name?: string;
      description?: string | null;
      basePrice?: number;
      imageUrl?: string | null;
      hasVariants?: boolean;
      displayOrder?: number;
      isActive?: boolean;
    },
  ) {
    return this.catalogService.updateProduct(id, body);
  }

  @Delete('products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteProduct(@Param('id') id: string) {
    return this.catalogService.deleteProduct(id);
  }

  @Post('products/:id/variants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createVariant(
    @Param('id') productId: string,
    @Body()
    body: {
      name: string;
      price: number;
      displayOrder?: number;
      isActive?: boolean;
    },
  ) {
    return this.catalogService.createVariant(productId, body);
  }

  @Patch('variants/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateVariant(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      price?: number;
      displayOrder?: number;
      isActive?: boolean;
    },
  ) {
    return this.catalogService.updateVariant(id, body);
  }

  @Delete('variants/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteVariant(@Param('id') id: string) {
    return this.catalogService.deleteVariant(id);
  }

  @Post('modifier-groups')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createModifierGroup(
    @Body()
    body: {
      name: string;
      description?: string | null;
      minSelections?: number;
      maxSelections?: number;
      displayOrder?: number;
      isActive?: boolean;
    },
  ) {
    return await this.catalogService.createModifierGroup(body);
  }

  @Patch('modifier-groups/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateModifierGroup(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string | null;
      minSelections?: number;
      maxSelections?: number;
      displayOrder?: number;
      isActive?: boolean;
    },
  ) {
    return await this.catalogService.updateModifierGroup(id, body);
  }

  @Delete('modifier-groups/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteModifierGroup(@Param('id') id: string) {
    return await this.catalogService.deleteModifierGroup(id);
  }

  @Post('modifier-groups/:id/modifiers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createModifier(
    @Param('id') groupId: string,
    @Body()
    body: {
      name: string;
      price: number;
      displayOrder?: number;
      isActive?: boolean;
    },
  ) {
    return await this.catalogService.createModifier(groupId, body);
  }

  @Patch('modifiers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateModifier(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      price?: number;
      displayOrder?: number;
      isActive?: boolean;
    },
  ) {
    return await this.catalogService.updateModifier(id, body);
  }

  @Delete('modifiers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteModifier(@Param('id') id: string) {
    return await this.catalogService.deleteModifier(id);
  }

  @Post('products/:id/modifier-groups')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async assignModifierGroupToProduct(
    @Param('id') productId: string,
    @Body() body: { modifierGroupId: string },
  ) {
    return await this.catalogService.assignModifierGroupToProduct(
      productId,
      body.modifierGroupId,
    );
  }

  @Delete('products/:id/modifier-groups/:groupId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async removeModifierGroupFromProduct(
    @Param('id') productId: string,
    @Param('groupId') modifierGroupId: string,
  ) {
    return await this.catalogService.removeModifierGroupFromProduct(
      productId,
      modifierGroupId,
    );
  }
}
