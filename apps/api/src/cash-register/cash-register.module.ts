import { Module } from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';

@Module({
  providers: [CashRegisterService],
  exports: [CashRegisterService],
})
export class CashRegisterModule {}
