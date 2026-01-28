
import { GoogleGenAI } from "@google/genai";
import { DashboardData } from "../types";

export const getFunnelDiagnosis = async (data: DashboardData): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Aja como um Estrategista Sênior de Sales Ops especializado em consórcio. 
    Analise os seguintes dados de performance da equipe e gere um diagnóstico crítico de exatamente 3 parágrafos.
    Foque em identificar onde o funil está vazando e quais ações práticas o gestor deve tomar.
    
    DADOS CONSOLIDADOS:
    - Anúncios: ${data.totals.ads}
    - Ligações: ${data.totals.calls}
    - Agendamentos: ${data.totals.appointments}
    - Visitas: ${data.totals.visits}
    - Fechamentos: ${data.totals.closings}
    - VGV Total: R$ ${data.totals.vgv.toLocaleString('pt-BR')}
    - Ticket Médio: R$ ${data.ticketMedio.toLocaleString('pt-BR')}
    
    EFICIÊNCIA:
    - Anúncio/Ligação: ${data.efficiency.adsToCall.toFixed(1)}
    - Ligação/Agendamento: ${data.efficiency.callToAppointment.toFixed(1)}
    - Agendamento/Visita: ${data.efficiency.appointmentToVisit.toFixed(1)}
    - Visita/Fechamento: ${data.efficiency.visitToClosing.toFixed(1)}

    Instruções:
    1. Seja direto e executivo. 
    2. Identifique a maior "dor" (ex: baixo volume de ligações vs anúncios, ou baixa conversão de visita).
    3. Use um tom profissional e motivador.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar o diagnóstico no momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao processar diagnóstico de IA. Verifique sua conexão ou chave de API.";
  }
};
