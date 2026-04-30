import { Module, Global } from '@nestjs/common';
import { BusinessConfigService } from './config.service';
import { BusinessConfigController } from './config.controller';

@Global()
@Module({
  controllers: [BusinessConfigController],
  providers: [BusinessConfigService],
  exports: [BusinessConfigService],
})
export class BusinessConfigModule {}
