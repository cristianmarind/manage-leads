export const LEAD_LOGGER = Symbol('LEAD_LOGGER');

export interface ILeadLogger {
  log(action: string, context: Record<string, unknown>): void;
}
