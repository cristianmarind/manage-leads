import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { type IAiSummaryProvider } from '../../domain/ai-summary.port';
import { Lead } from '../../domain/lead';

@Injectable()
export class OpenAiSummaryAdapter implements IAiSummaryProvider {
  private readonly client: OpenAI;

  constructor(config: ConfigService) {
    this.client = new OpenAI({
      apiKey: config.get<string>('OPENAI_API_KEY', ''),
    });
  }

  async generateLeadSummary(leads: Lead[]): Promise<string> {
    const data = leads.map((l) => ({
      fuente: l.fuente,
      presupuesto: l.presupuesto,
      producto_interes: l.producto_interes,
      fecha: l.created_at.toISOString().split('T')[0],
    }));

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `Eres un analista de negocio experto en ventas y captación de clientes.
Analiza los datos de leads y genera un resumen ejecutivo en español que incluya:
1. Análisis general del conjunto de leads
2. Fuente principal de captación y su rendimiento relativo
3. Análisis del presupuesto (promedio, distribución, segmentos detectados)
4. Recomendaciones accionables para mejorar la captación y conversión

Sé conciso, directo y orientado a datos. Usa listas cuando mejore la claridad.`,
        },
        {
          role: 'user',
          content: `Total de leads: ${leads.length}\n\nDatos:\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    });

    return response.choices[0]?.message?.content ?? '';
  }
}
