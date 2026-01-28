
import React, { useState } from 'react';
import { 
  FileText, TrendingUp, Users, DollarSign, Printer, Activity, Target, 
  RefreshCw, Lightbulb, CheckCircle2, Sparkles, Trophy, BarChart3, 
  Layers, ArrowLeft, Wallet, PieChart
} from 'lucide-react';
import { DashboardData } from './types';
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
    <div className={`glass-card p-6 flex flex-col items-center text-center transition-all hover:translate-y-[-4px] border-b-4 ${colorClass}`}>
      <div className={`p-4 rounded-2xl mb-4 bg-opacity-10 ${colorClass.replace('border-', 'bg-').replace('-600', '-500')}`}>
        <Icon size={24} className={colorClass.replace('border-', 'text-')} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">{label}</p>
      <p className="text-3xl font-black italic text-slate-900 tracking-tighter">{value}</p>
      {subtitle && <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">{subtitle}</p>}
    </div>
  );

  const ReportView = ({ data }: { data: DashboardData }) => {
    return (
      <div className="bg-white min-h-screen p-6 printable-content max-w-[297mm] mx-auto shadow-none">
        {/* Navbar para Controle */}
        <div className="no-print fixed top-0 left-0 right-0 bg-[#020617] text-white p-4 flex justify-between items-center z-[100] shadow-2xl">
          <div className="flex items-center gap-3 ml-4">
            <Activity size={20} className="text-blue-500" />
            <span className="font-black text-[10px] tracking-[0.3em] uppercase italic">SALES OPS CONSORTIUM HUB</span>
          </div>
          <div className="flex gap-4 mr-4">
            <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all">
              <Printer size={16} /> GERAR PDF
            </button>
            <button onClick={() => setView('dashboard')} className="bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all border border-white/10">
              <ArrowLeft size={16} /> PAINEL
            </button>
          </div>
        </div>

        {/* Header Visual Principal */}
        <div className="mt-16 mb-8 text-center">
          <h1 className="text-4xl font-black text-[#0f172a] uppercase tracking-tight italic border-b-[6px] border-[#0f172a] pb-2 inline-block px-12 leading-tight">
            RELATÓRIO DE PERFORMANCE ESTRATÉGICA
          </h1>
          <p className="text-slate-400 font-bold text-xs mt-4 tracking-[0.5em] uppercase italic">{data.reportDate.split('').join(' ')}</p>
        </div>

        {/* KPIs Globais no Report */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="border-[4px] border-[#020617] rounded-[2rem] p-8 bg-white flex flex-col items-center">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2 italic text-center">VGV GLOBAL CONSOLIDADO</p>
             <h2 className="text-4xl font-black text-[#020617] italic tracking-tighter">R$ {formatCurrency(data.totals.vgv)}</h2>
          </div>
          <div className="border-[4px] border-slate-200 rounded-[2rem] p-8 bg-white flex flex-col items-center">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2 italic text-center">TICKET OPERACIONAL</p>
             <h2 className="text-4xl font-black text-[#10b981] italic tracking-tighter">R$ {formatCurrency(data.ticketMedio)}</h2>
          </div>
          <div className="border-[4px] border-slate-200 rounded-[2rem] p-8 bg-white flex flex-col items-center">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2 italic text-center">EFICIÊNCIA GLOBAL V/F</p>
             <h2 className="text-4xl font-black text-[#2563eb] italic tracking-tighter">{data.efficiency.visitToClosing.toFixed(1)}</h2>
          </div>
        </div>

        {/* Tabelas de Métricas Completas */}
        <div className="space-y-12">
          {/* Tabela de Unidades */}
          <section className="page-break-inside-avoid">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-6 bg-[#2563eb]"></div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] italic text-[#0f172a]">EFICIÊNCIA POR UNIDADE ESTRATÉGICA</h3>
            </div>
            <div className="overflow-hidden rounded-[1.5rem] border-[4px] border-slate-900">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="bg-[#020617] text-white text-left italic uppercase font-black">
                    <th className="p-4">EQUIPE</th>
                    <th className="p-4 text-center">ANN</th>
                    <th className="p-4 text-center">LIG</th>
                    <th className="p-4 text-center">AGD</th>
                    <th className="p-4 text-center">VIS</th>
                    <th className="p-4 text-center">FCH</th>
                    <th className="p-4 text-right">VGV TOTAL</th>
                    <th className="p-3 text-center text-blue-300">A/L</th>
                    <th className="p-3 text-center text-blue-300">L/A</th>
                    <th className="p-3 text-center text-blue-300">A/V</th>
                    <th className="p-3 text-center text-[#10b981] bg-white/10">V/F</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold italic">
                  {data.teams.map((t, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-4 text-[#020617] uppercase font-black">{t.teamName}</td>
                      <td className="p-4 text-center text-slate-400">{t.totals.ads}</td>
                      <td className="p-4 text-center text-slate-400">{t.totals.calls}</td>
                      <td className="p-4 text-center text-slate-400">{t.totals.appointments}</td>
                      <td className="p-4 text-center text-slate-400">{t.totals.visits}</td>
                      <td className="p-4 text-center font-black">{t.totals.closings}</td>
                      <td className="p-4 text-right text-[#10b981] font-black">R$ {formatCurrency(t.totals.vgv)}</td>
                      <td className="p-3 text-center text-blue-600">{t.efficiency.adsToCall.toFixed(1)}</td>
                      <td className="p-3 text-center text-blue-600">{t.efficiency.callToAppointment.toFixed(1)}</td>
                      <td className="p-3 text-center text-blue-600">{t.efficiency.appointmentToVisit.toFixed(1)}</td>
                      <td className="p-3 text-center text-[#10b981] font-black bg-[#10b981]/5">{t.efficiency.visitToClosing.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Tabela Individual */}
          <section className="page-break-inside-avoid">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-6 bg-[#10b981]"></div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] italic text-[#0f172a]">RANKING INDIVIDUAL E MÉTRICAS DE CONVERSÃO</h3>
            </div>
            <div className="overflow-hidden rounded-[1.5rem] border-[4px] border-slate-900 shadow-xl">
              <table className="w-full text-[9px] border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-left italic uppercase font-black">
                    <th className="p-4">VENDEDOR [EQUIPE]</th>
                    <th className="p-2 text-center text-slate-400">ANN</th>
                    <th className="p-2 text-center text-slate-400">LIG</th>
                    <th className="p-2 text-center text-slate-400">AGD</th>
                    <th className="p-2 text-center text-slate-400">VIS</th>
                    <th className="p-2 text-center text-white">FCH</th>
                    <th className="p-4 text-right text-[#10b981]">VGV INDIVIDUAL</th>
                    <th className="p-2 text-center text-blue-300">A/L</th>
                    <th className="p-2 text-center text-blue-300">L/A</th>
                    <th className="p-2 text-center text-blue-300">A/V</th>
                    <th className="p-2 text-center text-[#10b981] font-black">V/F</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold italic">
                  {data.consultants.sort((a,b) => b.vgv - a.vgv).map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-[#020617] font-black">
                        {c.name} <span className="text-[7px] text-slate-400 ml-1 font-normal uppercase">[{c.team}]</span>
                      </td>
                      <td className="p-2 text-center text-slate-300">{c.ads}</td>
                      <td className="p-2 text-center text-slate-300">{c.calls}</td>
                      <td className="p-2 text-center text-slate-300">{c.appointments}</td>
                      <td className="p-2 text-center text-slate-300">{c.visits}</td>
                      <td className="p-2 text-center text-slate-900 font-black">{c.closings}</td>
                      <td className="p-4 text-right text-[#10b981] font-black bg-[#10b981]/5">R$ {formatCurrency(c.vgv)}</td>
                      <td className="p-2 text-center text-blue-500">{c.adsToCall.toFixed(1)}</td>
                      <td className="p-2 text-center text-blue-500">{c.callToAppointment.toFixed(1)}</td>
                      <td className="p-2 text-center text-blue-500">{c.appointmentToVisit.toFixed(1)}</td>
                      <td className="p-2 text-center text-[#10b981] font-black">{c.visitToClosing.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Diagnosis IA no Report */}
          {diagnosis && (
            <div className="bg-[#020617] rounded-[1.5rem] p-10 text-white mb-12 page-break-inside-avoid border-l-[12px] border-blue-600 relative overflow-hidden">
               <div className="absolute top-[-20px] right-[-20px] opacity-10 rotate-12">
                 <Sparkles size={180} />
               </div>
               <div className="flex items-center gap-3 mb-6">
                 <Sparkles className="text-blue-400" size={24} />
                 <h4 className="text-[12px] font-black uppercase tracking-[0.5em] italic">PARECER TÉCNICO ESTRATÉGICO (AI)</h4>
               </div>
               <div className="text-[12px] leading-relaxed font-semibold italic opacity-95 space-y-4 max-w-6xl">
                 {diagnosis.split('\n\n').map((para, i) => (
                   <p key={i}>{para}</p>
                 ))}
               </div>
            </div>
          )}
        </div>

        <footer className="mt-12 pt-8 text-center border-t border-slate-100 opacity-50">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[1em] italic leading-none">
            SISTEMA GENESIS CORE • {data.reportDate} • DOCUMENTO CONFIDENCIAL
          </p>
        </footer>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${view === 'report' ? 'bg-[#f1f5f9]' : 'bg-[#f8fafc]'}`}>
      {view === 'report' && data ? (
        <ReportView data={data} />
      ) : (
        <>
          <nav className="bg-[#020617] text-white px-10 py-5 flex justify-between items-center sticky top-0 z-50 shadow-2xl no-print">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/40"><Activity size={24} /></div>
              <div className="flex flex-col">
                <span className="font-black text-2xl tracking-tighter italic uppercase leading-none">GENESIS HUB</span>
                <span className="text-[9px] font-bold text-blue-400 tracking-[0.4em] uppercase mt-1">SPECIALIST SALES OPS</span>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={handleDemo} className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all">
                <Lightbulb size={16} className="text-yellow-400" /> CARREGAR DEMO
              </button>
              <button onClick={handleReset} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all group">
                <RefreshCw size={18} className="group-active:rotate-180 transition-transform duration-500" />
              </button>
            </div>
          </nav>

          <main className="max-w-7xl mx-auto px-8 py-12 no-print">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-20">
              <div className="lg:col-span-8">
                <div className="glass-card p-10 border-t-4 border-blue-600">
                  <div className="flex items-center gap-3 mb-8">
                    <FileText className="text-blue-600" size={24} />
                    <h2 className="font-black text-sm uppercase tracking-[0.2em] text-slate-800 italic">Dados Brutos do Funil</h2>
                  </div>
                  <textarea 
                    value={rawText} onChange={(e) => setRawText(e.target.value)} 
                    placeholder="Cole aqui o relatório copiado do grupo..." 
                    className="w-full h-60 bg-slate-50/50 border-2 border-slate-100 rounded-[2rem] p-8 text-sm focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/30 outline-none font-bold italic transition-all resize-none"
                  />
                </div>
              </div>

              <div className="lg:col-span-4">
                <div className="glass-card p-10 border-t-4 border-[#10b981] h-full">
                  <div className="flex items-center gap-3 mb-8">
                    <DollarSign className="text-[#10b981]" size={24} />
                    <h2 className="font-black text-sm uppercase tracking-[0.2em] text-slate-800 italic">Faturamento (VGV)</h2>
                  </div>
                  <textarea 
                    value={vgvText} onChange={(e) => setVgvText(e.target.value)} 
                    placeholder="NOME: VALOR..." 
                    className="w-full h-60 bg-slate-50/50 border-2 border-slate-100 rounded-[2rem] p-8 text-sm focus:ring-4 focus:ring-[#10b981]/5 focus:border-[#10b981]/30 outline-none font-bold italic transition-all resize-none"
                  />
                </div>
              </div>

              <div className="lg:col-span-12">
                 <button onClick={handleProcess} className="w-full py-6 bg-[#020617] text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.5em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 active:scale-[0.98]">
                  <TrendingUp size={24} /> COMPILAR DADOS ESTRATÉGICOS
                </button>
              </div>
            </div>

            {data && (
              <div className="space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-32">
                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
                  <div className="text-center md:text-left">
                    <h2 className="text-5xl font-black text-[#020617] tracking-tighter italic uppercase leading-none">ANÁLISE DE PERFORMANCE</h2>
                    <p className="text-slate-400 text-[11px] font-black mt-3 uppercase tracking-[0.4em]">CONSORTIUM SALES OPS HUB • {data.reportDate}</p>
                  </div>
                  <div className="flex gap-5">
                    <button onClick={handleAiDiagnosis} disabled={loadingAi} className="bg-indigo-50 text-indigo-700 px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-3 border-2 border-indigo-100 active:scale-95">
                      {loadingAi ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />} 
                      GERAR DIAGNÓSTICO IA
                    </button>
                    <button onClick={() => setView('report')} className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-blue-200 transition-all flex items-center gap-3 active:scale-95">
                      <Printer size={20} /> RELATÓRIO EXECUTIVO
                    </button>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="bg-[#020617] text-white p-10 rounded-[3rem] flex flex-col justify-center relative overflow-hidden shadow-2xl border-[4px] border-[#2563eb]">
                    <div className="absolute right-[-40px] top-[-40px] opacity-10">
                      <Wallet size={180} />
                    </div>
                    <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em] mb-4 italic">VOLUME GERAL DE VENDAS</p>
                    <h3 className="text-5xl font-black italic tracking-tighter leading-none">
                      R$ {formatCurrency(data.totals.vgv)}
                    </h3>
                  </div>
                  <StatCard label="TICKET MÉDIO OPERACIONAL" value={`R$ ${formatCurrency(data.ticketMedio)}`} icon={DollarSign} colorClass="border-[#10b981]" subtitle="EFICIÊNCIA POR FECHAMENTO" />
                  <StatCard label="CONVERSÃO MÉDIA V/F" value={data.efficiency.visitToClosing.toFixed(1)} icon={Activity} colorClass="border-[#2563eb]" subtitle="TAXA DE SUCESSO EM VISITA" />
                </div>

                {/* Main Table Dashboard */}
                <div className="glass-card overflow-hidden border-2 border-slate-50 shadow-2xl">
                  <div className="bg-slate-50/50 p-8 border-b border-slate-100 flex items-center gap-3">
                    <PieChart size={24} className="text-blue-600" />
                    <h3 className="font-black uppercase tracking-[0.2em] text-sm text-slate-800 italic">MÉTRICAS POR UNIDADE</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[#020617] text-white/50 font-black uppercase text-[10px] tracking-widest">
                        <tr>
                          <th className="px-10 py-5">Equipe</th>
                          <th className="px-6 py-5 text-center">ANN</th>
                          <th className="px-6 py-5 text-center">LIG</th>
                          <th className="px-6 py-5 text-center">AGD</th>
                          <th className="px-6 py-5 text-center">VIS</th>
                          <th className="px-6 py-5 text-center text-white">FCH</th>
                          <th className="px-10 py-5 text-right text-blue-300">VGV ACUMULADO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-black text-xs italic">
                        {data.teams.map((t, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-10 py-7 text-[#020617] uppercase text-sm">{t.teamName}</td>
                            <td className="px-6 text-center text-slate-400">{t.totals.ads}</td>
                            <td className="px-6 text-center text-slate-400">{t.totals.calls}</td>
                            <td className="px-6 text-center text-slate-400">{t.totals.appointments}</td>
                            <td className="px-6 text-center text-slate-400">{t.totals.visits}</td>
                            <td className="px-6 text-center text-[#020617] text-lg">{t.totals.closings}</td>
                            <td className="px-10 text-right text-[#10b981] text-sm font-black italic">R$ {formatCurrency(t.totals.vgv)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AI diagnosis Dashboard */}
                {diagnosis && (
                  <div className="bg-[#020617] rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden border-[6px] border-[#2563eb]">
                    <div className="absolute right-[-40px] bottom-[-40px] opacity-10">
                      <Sparkles size={250} />
                    </div>
                    <div className="flex items-center gap-4 mb-8">
                      <Sparkles className="text-blue-400" size={28} />
                      <h3 className="font-black uppercase tracking-[0.3em] text-sm italic">DIAGNÓSTICO PREDITIVO (AI)</h3>
                    </div>
                    <div className="relative z-10 space-y-6 text-slate-300 font-bold italic leading-relaxed text-sm max-w-5xl">
                      {diagnosis.split('\n\n').map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
};

export default App;
