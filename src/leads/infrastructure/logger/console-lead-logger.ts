import { Injectable } from '@nestjs/common';
import type { ILeadLogger } from '../../domain/lead-logger.port';

@Injectable()
export class ConsoleLeadLogger implements ILeadLogger {
  log(action: string, context: Record<string, unknown>): void {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), action, ...context }));
  }
}
