
import React, { useState, useEffect } from 'react';
import { 
  FileText, TrendingUp, Users, DollarSign, Printer, Cpu, RefreshCw,
  Wallet, PieChart, Activity, Target, Zap, ArrowLeft, Lightbulb,
  CheckCircle2, AlertCircle, Sparkles, Trophy, BarChart3, Layers
} from 'lucide-react';
import { DashboardData, ConsultantStats } from './types';
import { parseRawData } from './utils/parser';
import { getFunnelDiagnosis } from './services/geminiService';

const EXAMPLE_DATA = {
  raw: `EQUIPE RK
*MATHEUS*
Anúncios: 2626
Ligações: 1057
Agendamentos: 89
Visitas: 30
Fechamentos: 29

*RICHARLYSSON*
Anúncios: 1730
Ligações: 816
Agendamentos: 113
Visitas: 28
Fechamentos: 28

EQUIPE VENDAS PRO
*ERICA LIMA*
Anúncios: 2240
Ligações: 1120
Agendamentos: 140
Visitas: 84
Fechamentos: 56`,
  vgv: `MATHEUS: 850.000,00
RICHARLYSSON: 920.000,00
ERICA LIMA: 1.450.000,00`
};

const App: React.FC = () => {
  const [rawText, setRawText] = useState<string>('');
  const [vgvText, setVgvText] = useState<string>('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [view, setView] = useState<'dashboard' | 'report'>('dashboard');

  const handleProcess = () => {
    if (!rawText.trim() && !vgvText.trim()) return;
    const result = parseRawData(rawText, vgvText);
    setData(result);
    setDiagnosis('');
  };

  const handleDemo = () => {
    setRawText(EXAMPLE_DATA.raw);
    setVgvText(EXAMPLE_DATA.vgv);
    const result = parseRawData(EXAMPLE_DATA.raw, EXAMPLE_DATA.vgv);
    setData(result);
  };

  const handleAiDiagnosis = async () => {
    if (!data) return;
    setLoadingAi(true);
    const text = await getFunnelDiagnosis(data);
    setDiagnosis(text);
    setLoadingAi(false);
  };

  const handleReset = () => {
    setRawText('');
    setVgvText('');
    setData(null);
    setDiagnosis('');
    setView('dashboard');
    setLoadingAi(false);
  };

  const formatCurrency = (val: number) => 
    val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const StatCard = ({ label, value, icon: Icon, colorClass, subtitle }: any) => (
    <div className={`glass-card p-6 flex flex-col items-center text-center transition-all hover:scale-[1.02] border-b-4 ${colorClass}`}>
      <div className={`p-3 rounded-2xl mb-4 bg-opacity-10 ${colorClass.replace('border-', 'bg-').replace('-600', '-500')}`}>
        <Icon size={24} className={colorClass.replace('border-', 'text-')} />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
      {subtitle && <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">{subtitle}</p>}
    </div>
  );

  const ReportView = ({ data }: { data: DashboardData }) => {
    const triggerPrint = () => {
      window.print();
    };

    return (
      <div className="bg-white min-h-screen p-10 printable-content max-w-[210mm] mx-auto shadow-none">
        {/* Navbar de visualização (não imprime) */}
        <div className="no-print fixed top-0 left-0 right-0 bg-brand-dark text-white p-4 flex justify-between items-center z-[100] shadow-2xl border-b border-white/10">
          <div className="flex items-center gap-3 ml-4">
            <Activity size={20} className="text-blue-500" />
            <span className="font-bold text-xs tracking-[0.2em] uppercase italic">Relatório Consolidado de Performance</span>
          </div>
          <div className="flex gap-4 mr-4">
            <button 
              onClick={triggerPrint} 
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <Printer size={16} /> IMPRIMIR PDF
            </button>
            <button 
              onClick={() => setView('dashboard')} 
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all border border-white/10 active:scale-95"
            >
              <ArrowLeft size={16} /> VOLTAR AO SISTEMA
            </button>
          </div>
        </div>

        {/* Header PDF */}
        <div className="mt-16 mb-10 text-center">
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic border-b-4 border-slate-900 pb-2 inline-block px-12">
            RELATÓRIO CONSOLIDADO DE PERFORMANCE
          </h1>
          <div className="mt-4 flex flex-col items-center">
            <div className="h-1 w-24 bg-slate-900 mb-2"></div>
            <p className="text-slate-500 font-bold text-xl tracking-[0.4em]">{data.reportDate}</p>
          </div>
        </div>

        {/* Global Results Card - Reduced Dimensions */}
        <div className="border-[3px] border-slate-900 rounded-[2rem] p-6 mb-12 flex flex-col items-center shadow-sm max-w-2xl mx-auto bg-white">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] mb-3 text-center">FATURAMENTO CONSOLIDADO GLOBAL</p>
          <h2 className="text-4xl font-black text-slate-950 italic mb-6 tracking-tighter">R$ {formatCurrency(data.totals.vgv)}</h2>
          
          <div className="w-full max-w-lg h-px bg-slate-100 mb-6"></div>
          
          <div className="grid grid-cols-2 gap-8 w-full max-w-xl">
            <div className="text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic leading-none">TICKET MÉDIO OPERACIONAL</p>
              <p className="text-xl font-black text-emerald-600 italic">R$ {formatCurrency(data.ticketMedio)}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic leading-none">TICKET MÉDIO POR VENDEDOR</p>
              <p className="text-xl font-black text-blue-600 italic">R$ {formatCurrency(data.ticketMedioPorConsultor)}</p>
            </div>
          </div>
        </div>

        {/* Métricas de Volume */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-4 bg-slate-900"></div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] italic">Métricas de Volume Operacional</h3>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {[
              { l: 'ANÚNCIOS', v: data.totals.ads },
              { l: 'LIGAÇÕES', v: data.totals.calls },
              { l: 'AGENDAMENTOS', v: data.totals.appointments },
              { l: 'VISITAS', v: data.totals.visits },
              { l: 'FECHAMENTOS', v: data.totals.closings }
            ].map((m, i) => (
              <div key={i} className="border border-slate-200 rounded-xl p-4 text-center shadow-sm bg-slate-50/30">
                <p className="text-[7px] font-black text-slate-400 uppercase mb-1 tracking-widest leading-none">{m.l}</p>
                <p className="text-xl font-black text-slate-900 italic leading-none">{m.v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Eficiência de Conversão */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-4 bg-blue-600"></div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600 italic">Eficiência de Conversão do Funil</h3>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { l: 'ANÚNCIOS/LEAD', v: data.efficiency.adsToCall },
              { l: 'LIGAÇÃO/AGEND.', v: data.efficiency.callToAppointment },
              { l: 'AGEND./VISITA', v: data.efficiency.appointmentToVisit },
              { l: 'VISITA/FECH.', v: data.efficiency.visitToClosing }
            ].map((m, i) => (
              <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-2 tracking-widest leading-none">{m.l}</p>
                <p className="text-3xl font-black text-blue-600 italic leading-none">{m.v.toFixed(1)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabela de Unidades */}
        <div className="mb-12 page-break-inside-avoid">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-4 bg-blue-600"></div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600 italic">Performance e Eficiência por Unidade</h3>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-left italic uppercase font-black">
                  <th className="p-3">Equipe</th>
                  <th className="p-3 text-center">ANN</th>
                  <th className="p-3 text-center">LIG</th>
                  <th className="p-3 text-center">AGD</th>
                  <th className="p-3 text-center">VIS</th>
                  <th className="p-3 text-center">FCH</th>
                  <th className="p-3 text-right">VGV Total</th>
                  <th className="p-3 text-center text-blue-300">A/L</th>
                  <th className="p-3 text-center text-blue-300">L/A</th>
                  <th className="p-3 text-center text-blue-300">A/V</th>
                  <th className="p-3 text-center text-blue-300">V/F</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold italic">
                {data.teams.map((t, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-3 text-slate-900 uppercase">{t.teamName}</td>
                    <td className="p-3 text-center text-slate-400">{t.totals.ads}</td>
                    <td className="p-3 text-center text-slate-400">{t.totals.calls}</td>
                    <td className="p-3 text-center text-slate-400">{t.totals.appointments}</td>
                    <td className="p-3 text-center text-slate-400">{t.totals.visits}</td>
                    <td className="p-3 text-center text-slate-900">{t.totals.closings}</td>
                    <td className="p-3 text-right text-emerald-600">R$ {t.totals.vgv.toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-center text-blue-600">{t.efficiency.adsToCall.toFixed(1)}</td>
                    <td className="p-3 text-center text-blue-600">{t.efficiency.callToAppointment.toFixed(1)}</td>
                    <td className="p-3 text-center text-blue-600">{t.efficiency.appointmentToVisit.toFixed(1)}</td>
                    <td className="p-3 text-center text-blue-600">{t.efficiency.visitToClosing.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabela Individual (Ranking) */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-4 bg-emerald-500"></div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-600 italic">Ranking Individual de Performance</h3>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-[9px] border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-left italic uppercase font-black border-b border-slate-200">
                  <th className="p-3">Vendedor [Equipe]</th>
                  <th className="p-3 text-center">ANN</th>
                  <th className="p-3 text-center">LIG</th>
                  <th className="p-3 text-center">AGD</th>
                  <th className="p-3 text-center">VIS</th>
                  <th className="p-3 text-center">FCH</th>
                  <th className="p-3 text-right">VGV Total</th>
                  <th className="p-3 text-center text-blue-600">A/L</th>
                  <th className="p-3 text-center text-blue-600">L/A</th>
                  <th className="p-3 text-center text-blue-600">A/V</th>
                  <th className="p-3 text-center text-blue-600">V/F</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold italic">
                {data.consultants.sort((a,b) => b.closings - a.closings || b.vgv - a.vgv).map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-900">
                      {c.name} <span className="text-[7px] text-slate-400 ml-1">[{c.team}]</span>
                    </td>
                    <td className="p-3 text-center text-slate-300">{c.ads}</td>
                    <td className="p-3 text-center text-slate-300">{c.calls}</td>
                    <td className="p-3 text-center text-slate-300">{c.appointments}</td>
                    <td className="p-3 text-center text-slate-300">{c.visits}</td>
                    <td className="p-3 text-center text-slate-900">{c.closings}</td>
                    <td className="p-3 text-right text-emerald-600 bg-emerald-50/20">R$ {c.vgv.toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-center text-blue-600">{c.adsToCall.toFixed(1)}</td>
                    <td className="p-3 text-center text-blue-600">{c.callToAppointment.toFixed(1)}</td>
                    <td className="p-3 text-center text-blue-600">{c.appointmentToVisit.toFixed(1)}</td>
                    <td className="p-3 text-center text-blue-600">{c.visitToClosing.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {diagnosis && (
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white mb-12 page-break-inside-avoid shadow-2xl relative overflow-hidden">
            <div className="absolute top-[-20px] right-[-20px] opacity-10">
              <Sparkles size={120} />
            </div>
            <div className="flex items-center gap-2 mb-4 text-blue-400">
              <Sparkles size={18} />
              <h4 className="text-[10px] font-black uppercase tracking-widest italic">Análise de Inteligência Estratégica</h4>
            </div>
            <div className="text-xs leading-relaxed font-semibold italic opacity-90 space-y-3">
              {diagnosis.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        )}

        <footer className="mt-16 pt-8 text-center border-t border-slate-100">
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[1.5em] italic">
            GENESIS INTELLIGENT CORE PROTOCOL • OPERATIONAL SCALING PROTOCOL • {data.reportDate}
          </p>
        </footer>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${view === 'report' ? 'bg-slate-100/50' : 'bg-slate-50'}`}>
      {view === 'report' && data ? (
        <ReportView data={data} />
      ) : (
        <>
          <nav className="bg-slate-900 text-white px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-2xl no-print">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-600/20"><Activity size={20} /></div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tighter italic uppercase leading-none">Genesis Hub</span>
                <span className="text-[8px] font-bold text-blue-400 tracking-[0.3em] uppercase mt-0.5">Specialist Sales Ops</span>
              </div>
            </div>
            <div className="flex gap-4">
               <button onClick={handleDemo} className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold border border-white/10 transition-all">
                <Lightbulb size={14} className="text-yellow-400" /> DEMO
              </button>
              <button onClick={handleReset} className="p-2.5 bg-white/5 hover:bg-white/15 rounded-lg border border-white/5 transition-all">
                <RefreshCw size={16} />
              </button>
            </div>
          </nav>

          <main className="max-w-7xl mx-auto px-6 py-10 no-print">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
              <div className="lg:col-span-8">
                <div className="glass-card p-8 border-t-4 border-blue-600">
                  <div className="flex items-center gap-3 mb-6">
                    <FileText className="text-blue-600" size={20} />
                    <h2 className="font-black text-sm uppercase tracking-widest text-slate-800 italic">Relatórios do Grupo (WhatsApp)</h2>
                  </div>
                  <textarea 
                    value={rawText} onChange={(e) => setRawText(e.target.value)} 
                    placeholder="Cole os dados aqui..." 
                    className="w-full h-48 bg-slate-50 border border-slate-200 rounded-xl p-6 text-sm focus:ring-2 focus:ring-blue-600/20 outline-none font-medium transition-all"
                  />
                </div>
              </div>

              <div className="lg:col-span-4">
                <div className="glass-card p-8 border-t-4 border-emerald-500 h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <DollarSign className="text-emerald-500" size={20} />
                    <h2 className="font-black text-sm uppercase tracking-widest text-slate-800 italic">Faturamento Individual (VGV)</h2>
                  </div>
                  <textarea 
                    value={vgvText} onChange={(e) => setVgvText(e.target.value)} 
                    placeholder="NOME: VALOR..." 
                    className="w-full h-48 bg-slate-50 border border-slate-200 rounded-xl p-6 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium transition-all"
                  />
                </div>
              </div>

              <div className="lg:col-span-12">
                 <button onClick={handleProcess} className="w-full py-5 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-[0.4em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                  <TrendingUp size={20} /> COMPILAR RESULTADOS ESTRATÉGICOS
                </button>
              </div>
            </div>

            {data && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                  <div>
                    <h2 className="text-4xl font-black text-slate-950 tracking-tighter italic uppercase">Análise de Performance</h2>
                    <p className="text-slate-500 text-[10px] font-bold mt-1 uppercase tracking-[0.3em]">Protocolo {data.reportDate} • V02</p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={handleAiDiagnosis} disabled={loadingAi} className="bg-indigo-50 text-indigo-700 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2 border border-indigo-200">
                      {loadingAi ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={16} />} 
                      DIAGNÓSTICO IA
                    </button>
                    <button onClick={() => setView('report')} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-200 transition-all flex items-center gap-2">
                      <Printer size={18} /> RELATÓRIO COMPLETO
                    </button>
                  </div>
                </div>

                {/* VISÃO MACRO - VGV E MÉDIAS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-slate-900 text-white p-8 rounded-[2rem] md:col-span-1 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute right-[-20px] top-[-20px] opacity-10">
                      <Wallet size={150} />
                    </div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-2 italic">Volume Geral de Vendas</p>
                    <h3 className="text-4xl font-black italic tracking-tighter">
                      R$ {formatCurrency(data.totals.vgv)}
                    </h3>
                  </div>
                  <StatCard label="Ticket Médio / Venda" value={`R$ ${formatCurrency(data.ticketMedio)}`} icon={DollarSign} colorClass="border-emerald-500" subtitle="ROI Operacional" />
                  <StatCard label="Ticket Médio / Consultor" value={`R$ ${formatCurrency(data.ticketMedioPorConsultor)}`} icon={Users} colorClass="border-blue-500" subtitle="Produtividade Financeira" />
                </div>

                {/* MÉTRICAS DE VOLUME - DASHBOARD */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <BarChart3 className="text-slate-900" size={20} />
                    <h3 className="font-black uppercase tracking-widest text-sm text-slate-800 italic">Métricas de Volume Operacional</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <StatCard label="Anúncios" value={data.totals.ads} icon={FileText} colorClass="border-slate-200" />
                    <StatCard label="Ligações" value={data.totals.calls} icon={Users} colorClass="border-slate-200" />
                    <StatCard label="Agend." value={data.totals.appointments} icon={Target} colorClass="border-slate-200" />
                    <StatCard label="Visitas" value={data.totals.visits} icon={Activity} colorClass="border-slate-200" />
                    <StatCard label="Fech." value={data.totals.closings} icon={CheckCircle2} colorClass="border-emerald-600" />
                  </div>
                </div>

                {/* EFICIÊNCIA DE FUNIL - DASHBOARD */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Layers className="text-blue-600" size={20} />
                    <h3 className="font-black uppercase tracking-widest text-sm text-slate-800 italic">Eficiência de Conversão</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="glass-card p-6 bg-blue-50/30 border-l-4 border-blue-600 transition-all hover:bg-blue-100/40">
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Anúncios / Lead</p>
                      <p className="text-4xl font-black text-slate-900 italic">{data.efficiency.adsToCall.toFixed(1)}</p>
                      <div className="w-full bg-slate-200 h-1 mt-4 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${Math.min(data.efficiency.adsToCall * 10, 100)}%` }}></div>
                      </div>
                    </div>
                    <div className="glass-card p-6 bg-blue-50/30 border-l-4 border-blue-600 transition-all hover:bg-blue-100/40">
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Ligação / Agend.</p>
                      <p className="text-4xl font-black text-slate-900 italic">{data.efficiency.callToAppointment.toFixed(1)}</p>
                      <div className="w-full bg-slate-200 h-1 mt-4 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${Math.min(data.efficiency.callToAppointment * 10, 100)}%` }}></div>
                      </div>
                    </div>
                    <div className="glass-card p-6 bg-blue-50/30 border-l-4 border-blue-600 transition-all hover:bg-blue-100/40">
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Agend. / Visita</p>
                      <p className="text-4xl font-black text-slate-900 italic">{data.efficiency.appointmentToVisit.toFixed(1)}</p>
                      <div className="w-full bg-slate-200 h-1 mt-4 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${Math.min(data.efficiency.appointmentToVisit * 10, 100)}%` }}></div>
                      </div>
                    </div>
                    <div className="glass-card p-6 bg-blue-50/30 border-l-4 border-blue-600 transition-all hover:bg-blue-100/40">
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Visita / Fech.</p>
                      <p className="text-4xl font-black text-slate-900 italic">{data.efficiency.visitToClosing.toFixed(1)}</p>
                      <div className="w-full bg-slate-200 h-1 mt-4 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${Math.min(data.efficiency.visitToClosing * 10, 100)}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DIAGNÓSTICO IA - DASHBOARD SECTION */}
                {diagnosis && (
                  <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute right-[-30px] bottom-[-30px] opacity-10">
                      <Sparkles size={250} />
                    </div>
                    <div className="flex items-center gap-3 mb-6">
                      <Sparkles className="text-blue-400" size={24} />
                      <h3 className="font-black uppercase tracking-[0.2em] text-sm italic">Estratégia Proativa (AI Insights)</h3>
                    </div>
                    <div className="relative z-10 space-y-4 text-slate-300 font-medium italic leading-relaxed text-sm">
                      {diagnosis.split('\n\n').map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* PERFORMANCE POR UNIDADE - DASHBOARD */}
                <div className="glass-card overflow-hidden border border-slate-200 shadow-xl">
                  <div className="bg-slate-50 p-6 border-b border-slate-200 flex items-center gap-3">
                    <PieChart size={20} className="text-blue-600" />
                    <h3 className="font-black uppercase tracking-widest text-sm text-slate-800 italic">Performance por Unidade</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-500 font-black uppercase text-[9px]">
                        <tr>
                          <th className="px-8 py-4">Equipe</th>
                          <th className="px-4 py-4 text-center">ANN</th>
                          <th className="px-4 py-4 text-center">LIG</th>
                          <th className="px-4 py-4 text-center">AGD</th>
                          <th className="px-4 py-4 text-center">VIS</th>
                          <th className="px-4 py-4 text-center text-slate-900">FCH</th>
                          <th className="px-4 py-4 text-center text-blue-600">EFF</th>
                          <th className="px-8 py-4 text-right">VGV Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-bold text-xs italic">
                        {data.teams.map((t, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-8 py-5 text-slate-900 uppercase font-black">{t.teamName}</td>
                            <td className="px-4 text-center text-slate-400">{t.totals.ads}</td>
                            <td className="px-4 text-center text-slate-400">{t.totals.calls}</td>
                            <td className="px-4 text-center text-slate-400">{t.totals.appointments}</td>
                            <td className="px-4 text-center text-slate-400">{t.totals.visits}</td>
                            <td className="px-4 text-center font-black text-slate-900">{t.totals.closings}</td>
                            <td className="px-4 text-center text-blue-600">{t.efficiency.visitToClosing.toFixed(1)}</td>
                            <td className="px-8 text-right font-black text-emerald-600">R$ {formatCurrency(t.totals.vgv)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* RANKING INDIVIDUAL - DASHBOARD */}
                <div className="glass-card overflow-hidden border border-slate-200 shadow-xl">
                  <div className="bg-slate-50 p-6 border-b border-slate-200 flex items-center gap-3">
                    <Trophy size={20} className="text-yellow-600" />
                    <h3 className="font-black uppercase tracking-widest text-sm text-slate-800 italic">Ranking Individual Detalhado</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                        <tr>
                          <th className="px-8 py-4 sticky left-0 bg-slate-900">Consultor [Time]</th>
                          <th className="px-4 py-4 text-center">ANN</th>
                          <th className="px-4 py-4 text-center">LIG</th>
                          <th className="px-4 py-4 text-center">AGD</th>
                          <th className="px-4 py-4 text-center text-white">FCH</th>
                          <th className="px-4 py-4 text-center text-blue-400">V/F</th>
                          <th className="px-8 py-4 text-right bg-emerald-900 text-emerald-400 italic">VGV Individual</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-bold text-sm italic">
                        {data.consultants.sort((a,b) => b.closings - a.closings || b.vgv - a.vgv).map((c, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-8 py-6 sticky left-0 bg-white z-10 font-black text-slate-900 border-r border-slate-100">
                              {c.name} <span className="text-[8px] opacity-40">[{c.team}]</span>
                            </td>
                            <td className="px-4 text-center text-slate-400">{c.ads}</td>
                            <td className="px-4 text-center text-slate-400">{c.calls}</td>
                            <td className="px-4 text-center text-slate-400">{c.appointments}</td>
                            <td className="px-4 text-center font-black text-slate-900 text-lg">{c.closings}</td>
                            <td className="px-4 text-center text-blue-600">{c.visitToClosing.toFixed(1)}</td>
                            <td className="px-8 text-right font-black text-emerald-600 bg-emerald-50/30">R$ {formatCurrency(c.vgv)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
};

export default App;
