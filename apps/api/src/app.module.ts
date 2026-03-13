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

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    CatalogModule,
    OrdersModule,
    NotificationsModule,
    PaymentsModule,
    CashRegisterModule,
    TablesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
