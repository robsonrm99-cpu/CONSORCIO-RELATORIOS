
import { ConsultantStats, DashboardData, TeamStats, Metrics, Efficiency } from "../types";

// Função auxiliar para evitar divisões por zero e garantir arredondamento correto
const calcRatio = (num: number, den: number): number => den === 0 ? 0 : parseFloat((num / den).toFixed(1));

const getEfficiency = (m: Metrics): Efficiency => ({
  adsToCall: calcRatio(m.ads, m.calls),
  callToAppointment: calcRatio(m.calls, m.appointments),
  appointmentToVisit: calcRatio(m.appointments, m.visits),
  visitToClosing: calcRatio(m.visits, m.closings)
});

// Extrai número de uma linha buscando padrões comuns de relatórios
const extractMetricValue = (line: string, keywords: string[]): number => {
  // Ordena keywords da maior para menor para evitar que "AGEND" dê match parcial em "AGENDAMENTOS"
  const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
  const kwStr = sortedKeywords.join('|');
  
  // Pattern 1: Number... Keyword (Ex: "10 Agendamentos", "10 - Agend")
  // Prioridade alta pois evita capturar o número da próxima métrica (ex: "10 Agend 5 Visitas")
  // Regex: (Digitos) + (separadores opcionais) + (Palavra Chave)
  const p1 = new RegExp(`(\\d+)[:\\s\\-]*\\b(?:${kwStr})`, 'i');
  const m1 = line.match(p1);
  if (m1) return parseInt(m1[1], 10);

  // Pattern 2: Keyword... Number (Ex: "Agendamentos: 10", "Agend 10")
  // Regex: (Palavra Chave) + (separadores opcionais) + (Digitos)
  const p2 = new RegExp(`(?:${kwStr})[:\\s\\-=.>]*(\\d+)`, 'i');
  const m2 = line.match(p2);
  if (m2) return parseInt(m2[1], 10);

  return 0;
};

export const parseRawData = (rawText: string, vgvText: string): DashboardData => {
  // 1. Processamento do VGV (Financeiro)
  const vgvMap: Record<string, number> = {};
  
  vgvText.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    
    // Ignora linhas que pareçam cabeçalhos ou totais no input de VGV para evitar falsos positivos
    if (/TOTAL|EQUIPE|RESUMO|META|RELATÓRIO|DATA/i.test(trimmed)) return;

    // Tenta capturar Nome e Valor. Aceita formatos: "Nome: 100k", "Nome R$ 100.000", "Nome 100000"
    const match = trimmed.match(/^(.+?)[\s:\-]+((?:R\$)?\s*[\d\.,]+[kKmM]?)$/i);
    
    if (match) {
      const name = match[1].replace(/[*:]/g, '').trim().toUpperCase(); // Remove asteriscos e dois pontos do nome
      const valStr = match[2].toLowerCase().replace('r$', '').trim();
      
      let val = 0;
      if (valStr.includes('k')) {
        val = parseFloat(valStr.replace('k', '').replace(',', '.')) * 1000;
      } else if (valStr.includes('m')) {
        val = parseFloat(valStr.replace('m', '').replace(',', '.')) * 1000000;
      } else {
        const cleanVal = valStr.replace(/\./g, '').replace(',', '.');
        val = parseFloat(cleanVal);
      }
      
      if (!isNaN(val)) {
        vgvMap[name] = (vgvMap[name] || 0) + val;
      }
    }
  });

  // 2. Processamento do Relatório Operacional (WhatsApp)
  const lines = rawText.split('\n');
  let activeTeam = "GERAL"; 
  const salespeople: Record<string, { metrics: Metrics, team: string }> = {};
  let currentSalesperson: string | null = null;
  let reportDate = new Date().toLocaleDateString('pt-BR');

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const upperLine = trimmed.toUpperCase();
    const cleanLine = upperLine.replace(/[*]/g, '').trim(); 

    // Detecção de Data
    const dateMatch = trimmed.match(/(\d{2}\/\d{2}(?:\/\d{2,4})?)/);
    if (dateMatch) {
        if (upperLine.includes('RELATÓRIO') || upperLine.includes('RESUMO')) {
            reportDate = dateMatch[1];
        }
    }

    // Detecção de Equipe (Melhorada para aceitar ':' e outros formatos)
    // Ex: "EQUIPE: RK", "TIME ALPHA", "UNIDADE - CENTRO"
    if (/^(?:EQUIPE|UNIDADE|TIME|FILIAL)[\s:\-]+/i.test(cleanLine) || cleanLine.includes('RELATÓRIO DE EQUIPE')) {
      let teamName = cleanLine
        .replace(/RELATÓRIO|DE|EQUIPE|UNIDADE|TIME|FILIAL|DATA|[:\-*]/g, '')
        .replace(/\d{2}\/\d{2}.*/, '') 
        .trim();
      
      if (teamName.length > 1) {
        activeTeam = teamName;
        currentSalesperson = null; 
        return; 
      }
    }

    // Detecção de Vendedor
    let potentialName: string | null = null;

    // Lógica 1: Começa com Asterisco (Ex: *JEFERSON, * JEFERSON *, *JEFERSON:)
    // A regex antiga exigia fechar com *, agora aceitamos se apenas começar.
    if (trimmed.startsWith('*')) {
      potentialName = upperLine.replace(/[*:]/g, '').trim();
    }
    // Lógica 2: Prefixo Explícito (Vendedor: Nome)
    else if (/^(?:VENDEDOR|CONSULTOR|NOME)[\s:\-]+(.+)/i.test(cleanLine)) {
      const matchExplicit = cleanLine.match(/^(?:VENDEDOR|CONSULTOR|NOME)[\s:\-]+(.+)/i);
      if (matchExplicit) {
        potentialName = matchExplicit[1].trim().toUpperCase();
      }
    }

    // Validação do Nome Encontrado
    if (potentialName) {
      // Lista de palavras reservadas AUMENTADA para evitar falsos positivos
      // Ex: se a linha for "* Agendamentos:", 'potentialName' seria "AGENDAMENTOS", o que deve ser barrado.
      const isReserved = [
        'AGEND', 'LIG', 'VIS', 'FECH', 'ANÚN', 'ADS', 'RESUMO', 'TOTAL', 
        'DIÁRIO', 'SEMANAL', 'MENSAL', 'META', 'LEADS', 'LEAD',
        'EQUIPE', 'UNIDADE', 'TIME', 'FILIAL', 'RELATÓRIO', 'VENDEDOR' 
      ].some(word => potentialName!.includes(word));

      // Verifica também se o "nome" contém dígitos (ex: "10 Agendamentos" não pode virar nome)
      const hasNumbers = /\d/.test(potentialName);

      if (potentialName.length > 1 && !isReserved && !hasNumbers) {
        currentSalesperson = potentialName;
        if (!salespeople[currentSalesperson]) {
          salespeople[currentSalesperson] = {
            team: activeTeam,
            metrics: { ads: 0, calls: 0, appointments: 0, visits: 0, closings: 0, vgv: 0 }
          };
        }
      }
    }

    // Detecção de Métricas (Se houver um vendedor ativo)
    if (currentSalesperson && salespeople[currentSalesperson]) {
      const m = salespeople[currentSalesperson].metrics;

      // Extração robusta somando ao valor existente
      m.ads += extractMetricValue(line, ['ANÚNCIOS', 'ANUNCIOS', 'ANÚN', 'ANUN', 'ADS', 'LEADS', 'LEAD']);
      m.calls += extractMetricValue(line, ['LIGAÇÕES', 'LIGACOES', 'LIGAÇOES', 'LIGACOES', 'LIG', 'CONTATOS']);
      m.appointments += extractMetricValue(line, ['AGENDAMENTOS', 'AGENDAMENTO', 'AGEND', 'AGD', 'REUNIÕES', 'REUNIOES']);
      m.visits += extractMetricValue(line, ['VISITAS', 'VISITA', 'VIS', 'COMPARECIMENTOS', 'PRESENÇA', 'PRESENCA']);
      m.closings += extractMetricValue(line, ['FECHAMENTOS', 'FECHAMENTO', 'FECH', 'VENDAS', 'VENDA', 'FCH']);
    }
  });

  // 3. Cruzamento de Dados (VGV + Operacional)
  Object.entries(vgvMap).forEach(([name, vgvValue]) => {
    if (salespeople[name]) {
      salespeople[name].metrics.vgv = vgvValue;
    } else {
      salespeople[name] = {
        team: "GERAL",
        metrics: { ads: 0, calls: 0, appointments: 0, visits: 0, closings: 0, vgv: vgvValue }
      };
    }
  });

  // 4. Transformação para Estrutura Final
  const consultants: ConsultantStats[] = Object.entries(salespeople).map(([name, data]) => {
    const metrics: Metrics = data.metrics;
    return { ...metrics, name, team: data.team, ...getEfficiency(metrics) };
  });

  // Agrupamento por Times
  const teamMap: Record<string, TeamStats> = {};
  consultants.forEach(c => {
    if (!teamMap[c.team]) {
      teamMap[c.team] = {
        teamName: c.team,
        consultants: [],
        totals: { ads: 0, calls: 0, appointments: 0, visits: 0, closings: 0, vgv: 0 },
        efficiency: { adsToCall: 0, callToAppointment: 0, appointmentToVisit: 0, visitToClosing: 0 }
      };
    }
    const t = teamMap[c.team];
    t.consultants.push(c);
    
    t.totals.ads += c.ads;
    t.totals.calls += c.calls;
    t.totals.appointments += c.appointments;
    t.totals.visits += c.visits;
    t.totals.closings += c.closings;
    t.totals.vgv += c.vgv;
  });

  Object.values(teamMap).forEach(t => { t.efficiency = getEfficiency(t.totals); });

  const globalTotals: Metrics = consultants.reduce((acc, curr) => ({
    ads: acc.ads + curr.ads,
    calls: acc.calls + curr.calls,
    appointments: acc.appointments + curr.appointments,
    visits: acc.visits + curr.visits,
    closings: acc.closings + curr.closings,
    vgv: acc.vgv + curr.vgv
  }), { ads: 0, calls: 0, appointments: 0, visits: 0, closings: 0, vgv: 0 });

  return {
    reportDate,
    consultants,
    teams: Object.values(teamMap),
    totals: globalTotals,
    efficiency: getEfficiency(globalTotals),
    ticketMedio: globalTotals.closings === 0 ? globalTotals.vgv : globalTotals.vgv / globalTotals.closings,
    ticketMedioPorConsultor: consultants.length === 0 ? globalTotals.vgv : globalTotals.vgv / consultants.length
  };
};
