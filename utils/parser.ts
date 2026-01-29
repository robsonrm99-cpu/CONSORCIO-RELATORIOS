
import { ConsultantStats, DashboardData, TeamStats, Metrics, Efficiency } from "../types";

// Função auxiliar para evitar divisões por zero e garantir arredondamento correto
const calcRatio = (num: number, den: number): number => den === 0 ? 0 : parseFloat((num / den).toFixed(1));

const getEfficiency = (m: Metrics): Efficiency => ({
  adsToCall: calcRatio(m.ads, m.calls),
  callToAppointment: calcRatio(m.calls, m.appointments),
  appointmentToVisit: calcRatio(m.appointments, m.visits),
  visitToClosing: calcRatio(m.visits, m.closings)
});

const extractMetricValue = (line: string, keywords: string[]): number => {
  const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
  const kwStr = sortedKeywords.join('|');
  
  // Tenta formato: "20 Anúncios", "20Anúncios", "20 - Anúncios"
  const p1 = new RegExp(`(\\d+)[\\s\\-]*\\b(?:${kwStr})\\b`, 'i');
  const m1 = line.match(p1);
  if (m1) return parseInt(m1[1], 10);
  
  // Tenta formato: "Anúncios: 20", "Anúncios:20", "Anúncios - 20"
  const p2 = new RegExp(`(?:${kwStr})[:\\s\\-=.>]*(\\d+)`, 'i');
  const m2 = line.match(p2);
  if (m2) return parseInt(m2[1], 10);
  
  return 0;
};

/**
 * Valida se uma string tem características de metadados de chat ou lixo (timestamps, telefones, etc)
 */
const isLikelyJunk = (text: string): boolean => {
  const t = text.trim();
  if (!t) return true;
  // Ignora cabeçalho de mensagem do WhatsApp: [20/01, 08:16] +55...
  if (/^\[\d{2}\/\d{2},?\s\d{2}[:\.]\d{2}\]/.test(t)) return true;
  // Ignora se for apenas número de telefone
  if (/^[\d\s\-\+\(\)]+$/.test(t) && t.length > 8) return true;
  // Ignora linhas de cabeçalho padrão
  if (/Relatório da equipe/i.test(t)) return true;
  return false;
};

export const parseRawData = (rawText: string, vgvText: string): DashboardData => {
  const vgvMap: Record<string, number> = {};
  
  // 1. Processar VGV (Faturamento)
  vgvText.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const match = trimmed.match(/^(.+?)[\s:\-]+((?:R\$)?\s*[0-9\.,]+[kKmM]?)$/i);
    if (match) {
      const name = match[1].replace(/[*:]/g, '').trim().toUpperCase();
      const valStr = match[2].toLowerCase().replace('r$', '').replace(/\s/g, '').trim();
      let val = 0;
      if (valStr.includes('k')) val = parseFloat(valStr.replace('k', '').replace(',', '.')) * 1000;
      else if (valStr.includes('m')) val = parseFloat(valStr.replace('m', '').replace(',', '.')) * 1000000;
      else val = parseFloat(valStr.replace(/\./g, '').replace(',', '.'));
      if (!isNaN(val)) vgvMap[name] = (vgvMap[name] || 0) + val;
    }
  });

  const lines = rawText.split('\n');
  let activeTeam = "GERAL"; 
  const knownTeams = new Set<string>(["GERAL"]);
  const salespeople: Record<string, { metrics: Metrics, team: string }> = {};
  let currentSalesperson: string | null = null;
  let reportDate = new Date().toLocaleDateString('pt-BR');

  // Pre-pass: Identificar nomes de Equipes para evitar que virem nomes de vendedores
  lines.forEach(line => {
    const upper = line.trim().toUpperCase().replace(/[*:]/g, '');
    if (upper.includes('EQUIPE')) {
      const teamPart = upper.replace('EQUIPE', '').trim();
      if (teamPart.length > 1) knownTeams.add(teamPart);
    }
  });

  // Main pass: Extração de dados
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || isLikelyJunk(trimmed)) return;
    
    const upperLine = trimmed.toUpperCase().replace(/[*:]/g, '');
    
    // Detecção de Equipe
    if (upperLine.includes('EQUIPE')) {
      const teamName = upperLine.replace('EQUIPE', '').trim();
      if (teamName.length > 1) {
        activeTeam = teamName;
        // Caso especial: se detectarmos equipe logo após o vendedor, atualizamos o vendedor
        if (currentSalesperson && salespeople[currentSalesperson] && salespeople[currentSalesperson].team === "GERAL") {
          salespeople[currentSalesperson].team = activeTeam;
        }
        return;
      }
    }

    // Detecção de Vendedor
    // Regras: entre asteriscos OU linha sem números/pontuação que não é equipe nem métrica
    const isMetricLine = ['ANÚN', 'LIG', 'AGEND', 'VISIT', 'FECH', 'CONTATO', 'VENDAS'].some(kw => upperLine.includes(kw));
    const isSalesperson = (trimmed.startsWith('*') || (trimmed.length > 2 && trimmed.length < 30)) && 
                          !isMetricLine && 
                          !upperLine.includes('EQUIPE') && 
                          !knownTeams.has(upperLine);

    if (isSalesperson) {
      const name = upperLine.trim();
      currentSalesperson = name;
      if (!salespeople[currentSalesperson]) {
        salespeople[currentSalesperson] = { 
          team: activeTeam, 
          metrics: { ads: 0, calls: 0, appointments: 0, visits: 0, closings: 0, vgv: 0 }
        };
      }
    }

    // Extração de métricas
    if (currentSalesperson && salespeople[currentSalesperson]) {
      const m = salespeople[currentSalesperson].metrics;
      m.ads += extractMetricValue(line, ['ANÚNCIOS', 'ANUNCIOS', 'ANÚN', 'ANUN', 'ADS']);
      m.calls += extractMetricValue(line, ['LIGAÇÕES', 'LIG', 'CONTATOS', 'LIGAÇOES', 'LIGACOES']);
      m.appointments += extractMetricValue(line, ['AGENDAMENTOS', 'AGEND', 'AGD', 'AGENDAMENTO']);
      m.visits += extractMetricValue(line, ['VISITAS', 'VISITA', 'VIS']);
      m.closings += extractMetricValue(line, ['FECHAMENTOS', 'FECH', 'VENDAS', 'FECHAMENTO', 'FCH']);
    }
  });

  // Mapear VGV do financeiro
  Object.entries(vgvMap).forEach(([name, vgvValue]) => {
    if (salespeople[name]) {
      salespeople[name].metrics.vgv += vgvValue;
    } else {
      const foundKey = Object.keys(salespeople).find(k => k.includes(name) || name.includes(k));
      if (foundKey) {
        salespeople[foundKey].metrics.vgv += vgvValue;
      } else if (!isLikelyJunk(name) && !knownTeams.has(name)) {
        salespeople[name] = { 
          team: "GERAL", 
          metrics: { ads: 0, calls: 0, appointments: 0, visits: 0, closings: 0, vgv: vgvValue }
        };
      }
    }
  });

  // Filtragem final: Remove ghost rows (nomes de equipes que sobraram ou linhas vazias)
  const filteredSalespeople = Object.entries(salespeople)
    .filter(([name, data]) => {
      const m = data.metrics;
      const isTeamName = knownTeams.has(name) || name === "RK" || name === "ALCANTES";
      return !isTeamName && (m.ads > 0 || m.calls > 0 || m.appointments > 0 || m.visits > 0 || m.closings > 0 || m.vgv > 0);
    })
    .map(([name, data]) => ({
      ...data.metrics, 
      name, 
      team: data.team, 
      ...getEfficiency(data.metrics)
    }));

  const teamMap: Record<string, TeamStats> = {};
  filteredSalespeople.forEach(c => {
    if (!teamMap[c.team]) {
      teamMap[c.team] = {
        teamName: c.team, consultants: [],
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
  
  const globalTotals: Metrics = filteredSalespeople.reduce((acc, curr) => ({
    ads: acc.ads + curr.ads, calls: acc.calls + curr.calls, appointments: acc.appointments + curr.appointments,
    visits: acc.visits + curr.visits, closings: acc.closings + curr.closings, vgv: acc.vgv + curr.vgv
  }), { ads: 0, calls: 0, appointments: 0, visits: 0, closings: 0, vgv: 0 });

  return {
    reportDate, 
    consultants: filteredSalespeople, 
    teams: Object.values(teamMap), 
    totals: globalTotals, 
    efficiency: getEfficiency(globalTotals),
    ticketMedio: globalTotals.closings === 0 ? globalTotals.vgv : globalTotals.vgv / globalTotals.closings,
    ticketMedioPorConsultor: filteredSalespeople.length === 0 ? globalTotals.vgv : globalTotals.vgv / filteredSalespeople.length
  };
};
