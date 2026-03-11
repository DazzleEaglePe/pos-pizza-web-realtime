import { Module, Global } from '@nestjs/common';
import { db } from '../../drizzle/db';

const DRIZZLE_PROVIDER = 'DRIZZLE';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_PROVIDER,
      useValue: db,
    },
  ],
  exports: [DRIZZLE_PROVIDER],
})
export class DatabaseModule {}
