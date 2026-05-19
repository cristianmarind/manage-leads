import { Lead } from './lead';

export const AI_SUMMARY_PORT = Symbol('AI_SUMMARY_PORT');

export interface IAiSummaryProvider {
  generateLeadSummary(leads: Lead[]): Promise<string>;
}
