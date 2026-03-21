import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { OrdersModule } from './orders/orders.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { CashRegisterModule } from './cash-register/cash-register.module';
import { TablesModule } from './tables/tables.module';
import { PromotionsModule } from './promotions/promotions.module';
import { TrackingModule } from './tracking/tracking.module';
import { InventoryModule } from './inventory/inventory.module';
import { BusinessConfigModule } from './config/config.module';
import { ReportsModule } from './reports/reports.module';
import { UsersModule } from './users/users.module';
import { AuditModule } from './audit/audit.module';
import { PrinterModule } from './printer/printer.module';
import { AuditInterceptor } from './audit/audit.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    DatabaseModule,
    BusinessConfigModule,
    AuthModule,
    CatalogModule,
    OrdersModule,
    NotificationsModule,
    PaymentsModule,
    CashRegisterModule,
    TablesModule,
    PromotionsModule,
    TrackingModule,
    InventoryModule,
    ReportsModule,
    UsersModule,
    AuditModule,
    PrinterModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
