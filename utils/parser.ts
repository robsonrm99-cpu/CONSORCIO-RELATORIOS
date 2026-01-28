
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
  const p1 = new RegExp(`(\\d+)[\\s\\-]*\\b(?:${kwStr})\\b`, 'i');
  const m1 = line.match(p1);
  if (m1) return parseInt(m1[1], 10);
  const p2 = new RegExp(`(?:${kwStr})[:\\s\\-=.>]*(\\d+)`, 'i');
  const m2 = line.match(p2);
  if (m2) return parseInt(m2[1], 10);
  return 0;
};

export const parseRawData = (rawText: string, vgvText: string): DashboardData => {
  const vgvMap: Record<string, number> = {};
  
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
  const salespeople: Record<string, { metrics: Metrics, team: string }> = {};
  let currentSalesperson: string | null = null;
  let reportDate = new Date().toLocaleDateString('pt-BR');

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const upperLine = trimmed.toUpperCase();

    if (/^(?:EQUIPE|UNIDADE|TIME|FILIAL)[\s:\-]+/i.test(upperLine) || upperLine.includes('EQUIPE ')) {
      let teamName = upperLine.replace(/RELATÓRIO|DE|EQUIPE|UNIDADE|TIME|FILIAL|DATA|[:\-*]/g, '').trim();
      if (teamName.length > 1) { activeTeam = teamName; currentSalesperson = null; return; }
    }

    let potentialName: string | null = null;
    if (trimmed.startsWith('*') || trimmed.endsWith('*')) potentialName = upperLine.replace(/[*:]/g, '').trim();
    else if (/^(?:VENDEDOR|CONSULTOR|NOME)[\s:\-]+(.+)/i.test(upperLine)) {
      const m = upperLine.match(/^(?:VENDEDOR|CONSULTOR|NOME)[\s:\-]+(.+)/i);
      if (m) potentialName = m[1].trim();
    }

    if (potentialName) {
      const isReserved = ['AGEND', 'LIG', 'VIS', 'FECH', 'ADS', 'TOTAL', 'META', 'EQUIPE'].some(word => potentialName!.includes(word));
      if (potentialName.length > 2 && !isReserved && !/\d/.test(potentialName)) {
        currentSalesperson = potentialName;
        if (!salespeople[currentSalesperson]) {
          salespeople[currentSalesperson] = { team: activeTeam, metrics: { ads: 0, calls: 0, appointments: 0, visits: 0, closings: 0, vgv: 0 }};
        }
      }
    }

    if (currentSalesperson && salespeople[currentSalesperson]) {
      const m = salespeople[currentSalesperson].metrics;
      m.ads += extractMetricValue(line, ['ANÚNCIOS', 'ANUNCIOS', 'ANÚN', 'ANUN', 'ADS']);
      m.calls += extractMetricValue(line, ['LIGAÇÕES', 'LIG', 'CONTATOS']);
      m.appointments += extractMetricValue(line, ['AGENDAMENTOS', 'AGEND', 'AGD']);
      m.visits += extractMetricValue(line, ['VISITAS', 'VISITA', 'VIS']);
      m.closings += extractMetricValue(line, ['FECHAMENTOS', 'FECH', 'VENDAS']);
    }
  });

  Object.entries(vgvMap).forEach(([name, vgvValue]) => {
    if (salespeople[name]) salespeople[name].metrics.vgv = vgvValue;
    else {
      const foundKey = Object.keys(salespeople).find(k => k.includes(name) || name.includes(k));
      if (foundKey) salespeople[foundKey].metrics.vgv += vgvValue;
      else salespeople[name] = { team: "GERAL", metrics: { ads: 0, calls: 0, appointments: 0, visits: 0, closings: 0, vgv: vgvValue }};
    }
  });

  const consultants: ConsultantStats[] = Object.entries(salespeople).map(([name, data]) => ({
    ...data.metrics, name, team: data.team, ...getEfficiency(data.metrics)
  }));

  const teamMap: Record<string, TeamStats> = {};
  consultants.forEach(c => {
    if (!teamMap[c.team]) {
      teamMap[c.team] = {
        teamName: c.team, consultants: [],
        totals: { ads: 0, calls: 0, appointments: 0, visits: 0, closings: 0, vgv: 0 },
        efficiency: { adsToCall: 0, callToAppointment: 0, appointmentToVisit: 0, visitToClosing: 0 }
      };
    }
    const t = teamMap[c.team];
    t.consultants.push(c);
    t.totals.ads += c.ads; t.totals.calls += c.calls; t.totals.appointments += c.appointments;
    t.totals.visits += c.visits; t.totals.closings += c.closings; t.totals.vgv += c.vgv;
  });

  Object.values(teamMap).forEach(t => { t.efficiency = getEfficiency(t.totals); });
  const globalTotals: Metrics = consultants.reduce((acc, curr) => ({
    ads: acc.ads + curr.ads, calls: acc.calls + curr.calls, appointments: acc.appointments + curr.appointments,
    visits: acc.visits + curr.visits, closings: acc.closings + curr.closings, vgv: acc.vgv + curr.vgv
  }), { ads: 0, calls: 0, appointments: 0, visits: 0, closings: 0, vgv: 0 });

  return {
    reportDate, consultants, teams: Object.values(teamMap), totals: globalTotals, efficiency: getEfficiency(globalTotals),
    ticketMedio: globalTotals.closings === 0 ? globalTotals.vgv : globalTotals.vgv / globalTotals.closings,
    ticketMedioPorConsultor: consultants.length === 0 ? globalTotals.vgv : globalTotals.vgv / consultants.length
  };
};
