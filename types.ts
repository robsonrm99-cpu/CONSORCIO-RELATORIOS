
export interface Metrics {
  ads: number;
  calls: number;
  appointments: number;
  visits: number;
  closings: number;
  vgv: number;
}

export interface Efficiency {
  adsToCall: number;
  callToAppointment: number;
  appointmentToVisit: number;
  visitToClosing: number;
}

export interface ConsultantStats extends Metrics, Efficiency {
  name: string;
  team: string;
}

export interface TeamStats {
  teamName: string;
  consultants: ConsultantStats[];
  totals: Metrics;
  efficiency: Efficiency;
}

export interface DashboardData {
  reportDate: string;
  consultants: ConsultantStats[];
  teams: TeamStats[];
  totals: Metrics;
  efficiency: Efficiency;
  ticketMedio: number;
  ticketMedioPorConsultor: number;
}
