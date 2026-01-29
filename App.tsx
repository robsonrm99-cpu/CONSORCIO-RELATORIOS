
import React, { useState, useRef } from 'react';
import { 
  FileText, TrendingUp, Users, DollarSign, Printer, Activity, Target, 
  RefreshCw, Lightbulb, CheckCircle2, Sparkles, Trophy, BarChart3, 
  Layers, ArrowLeft, Wallet, PieChart, Download, BarChart
} from 'lucide-react';
import { DashboardData, TeamStats, ConsultantStats } from './types';
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
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [view, setView] = useState<'dashboard' | 'report'>('dashboard');
  
  const reportRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (val: number) => 
    val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

  const handleDownloadPdf = () => {
    if (!reportRef.current) return;
    setIsDownloading(true);
    const element = reportRef.current;
    const opt = {
      margin: 10,
      filename: `Genesis_Report_${data?.reportDate.replace(/\//g, '-') || 'Export'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    // @ts-ignore
    html2pdf().set(opt).from(element).save().then(() => setIsDownloading(false));
  };

  const handleReset = () => {
    setRawText('');
    setVgvText('');
    setData(null);
    setDiagnosis('');
    setView('dashboard');
    setLoadingAi(false);
  };

  // Shared Components
  const SectionHeader = ({ title, colorClass }: any) => (
    <div className="flex items-center gap-3 mb-4 page-break-avoid">
      <div className={`w-1 h-5 rounded-full ${colorClass}`}></div>
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] italic text-slate-800">{title}</h3>
    </div>
  );

  const VolumeGrid = ({ totals }: { totals: any }) => (
    <div className="grid grid-cols-5 gap-3 mb-8 page-break-avoid">
      {[
        { label: 'ANÚNCIOS', value: totals.ads },
        { label: 'LIGAÇÕES', value: totals.calls },
        { label: 'AGENDAMENTOS', value: totals.appointments },
        { label: 'VISITAS', value: totals.visits },
        { label: 'FECHAMENTOS', value: totals.closings, highlight: true }
      ].map((item, idx) => (
        <div key={idx} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
          <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 italic leading-none">{item.label}</span>
          <span className={`text-3xl font-black italic tracking-tighter ${item.highlight ? 'text-blue-600' : 'text-slate-800'}`}>{item.value}</span>
        </div>
      ))}
    </div>
  );

  const EfficiencyGrid = ({ efficiency }: { efficiency: any }) => (
    <div className="grid grid-cols-4 gap-3 mb-8 page-break-avoid">
      {[
        { label: 'ANÚNCIOS/LEAD', value: efficiency.adsToCall },
        { label: 'LIGAÇÃO/AGEND.', value: efficiency.callToAppointment },
        { label: 'AGEND./VISITA', value: efficiency.appointmentToVisit },
        { label: 'VISITA/FECH.', value: efficiency.visitToClosing }
      ].map((item, idx) => (
        <div key={idx} className="bg-blue-50/20 border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
          <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 italic leading-none">{item.label}</span>
          <span className="text-2xl font-black italic text-blue-600 tracking-tighter">{item.value.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );

  const UnitTable = ({ teams }: { teams: TeamStats[] }) => (
    <div className="overflow-hidden rounded-2xl border-[1.5px] border-slate-200 mb-8 page-break-avoid shadow-sm">
      <table className="w-full text-[9px] border-collapse">
        <thead>
          <tr className="bg-slate-900 text-white text-left italic uppercase font-black">
            <th className="p-3 w-32">EQUIPE</th>
            <th className="p-1 text-center">ANN</th>
            <th className="p-1 text-center">LIG</th>
            <th className="p-1 text-center">AGD</th>
            <th className="p-1 text-center">VIS</th>
            <th className="p-1 text-center">FCH</th>
            <th className="p-3 text-right">VGV TOTAL</th>
            <th className="p-1 text-center text-blue-300">A/L</th>
            <th className="p-1 text-center text-blue-300">L/A</th>
            <th className="p-1 text-center text-blue-300">A/V</th>
            <th className="p-1 text-center text-blue-300">V/F</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-bold italic">
          {teams.map((t, i) => (
            <tr key={i} className="hover:bg-slate-50 transition-colors">
              <td className="p-3 text-slate-900 uppercase font-black">{t.teamName}</td>
              <td className="p-1 text-center text-slate-400">{t.totals.ads}</td>
              <td className="p-1 text-center text-slate-400">{t.totals.calls}</td>
              <td className="p-1 text-center text-slate-400">{t.totals.appointments}</td>
              <td className="p-1 text-center text-slate-400">{t.totals.visits}</td>
              <td className="p-1 text-center text-slate-900 font-black">{t.totals.closings}</td>
              <td className="p-3 text-right text-emerald-500 font-black">R$ {formatCurrency(t.totals.vgv)}</td>
              <td className="p-1 text-center text-blue-600">{t.efficiency.adsToCall.toFixed(1)}</td>
              <td className="p-1 text-center text-blue-600">{t.efficiency.callToAppointment.toFixed(1)}</td>
              <td className="p-1 text-center text-blue-600">{t.efficiency.appointmentToVisit.toFixed(1)}</td>
              <td className="p-1 text-center text-blue-600">{t.efficiency.visitToClosing.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const RankingTable = ({ consultants }: { consultants: ConsultantStats[] }) => (
    <div className="overflow-hidden rounded-2xl border-[1.5px] border-slate-200 mb-8 page-break-avoid shadow-sm">
      <table className="w-full text-[8.5px] border-collapse">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-left italic uppercase font-black">
            <th className="p-3 w-40 border-b border-slate-200">VENDEDOR [EQUIPE]</th>
            <th className="p-1 text-center border-b border-slate-200">ANN</th>
            <th className="p-1 text-center border-b border-slate-200">LIG</th>
            <th className="p-1 text-center border-b border-slate-200">AGD</th>
            <th className="p-1 text-center border-b border-slate-200">VIS</th>
            <th className="p-1 text-center border-b border-slate-200">FCH</th>
            <th className="p-3 text-right border-b border-slate-200 text-emerald-600">VGV TOTAL</th>
            <th className="p-1 text-center border-b border-slate-200 text-blue-500">A/L</th>
            <th className="p-1 text-center border-b border-slate-200 text-blue-500">L/A</th>
            <th className="p-1 text-center border-b border-slate-200 text-blue-500">A/V</th>
            <th className="p-1 text-center border-b border-slate-200 text-blue-500">V/F</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-bold italic">
          {consultants.sort((a,b) => b.vgv - a.vgv).map((c, i) => (
            <tr key={i} className="hover:bg-slate-50 transition-colors">
              <td className="p-3 text-slate-900 font-black">
                {c.name} <span className="text-[6.5px] text-slate-400 ml-1 font-normal uppercase italic">[{c.team}]</span>
              </td>
              <td className="p-1 text-center text-slate-400">{c.ads}</td>
              <td className="p-1 text-center text-slate-400">{c.calls}</td>
              <td className="p-1 text-center text-slate-400">{c.appointments}</td>
              <td className="p-1 text-center text-slate-400">{c.visits}</td>
              <td className="p-1 text-center text-slate-900 font-black">{c.closings}</td>
              <td className="p-3 text-right text-emerald-500 font-black bg-emerald-50/5">R$ {formatCurrency(c.vgv)}</td>
              <td className="p-1 text-center text-blue-600">{c.adsToCall.toFixed(1)}</td>
              <td className="p-1 text-center text-blue-600">{c.callToAppointment.toFixed(1)}</td>
              <td className="p-1 text-center text-blue-600">{c.appointmentToVisit.toFixed(1)}</td>
              <td className="p-1 text-center text-blue-600">{c.visitToClosing.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const DashboardContent = ({ data }: { data: DashboardData }) => (
    <div className="space-y-8">
      {/* KPIs SUPERIORES - REDUZIDOS PARA OTIMIZAR ESPAÇO */}
      <div className="border-[2px] border-blue-500 rounded-[1.5rem] p-6 bg-white relative overflow-hidden page-break-avoid shadow-sm">
        <div className="flex flex-col items-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 italic text-center">FATURAMENTO CONSOLIDADO GLOBAL</p>
          <h3 className="text-4xl font-black italic tracking-tighter leading-none text-slate-900 mb-6">
            R$ {formatCurrency(data.totals.vgv)}
          </h3>
          <div className="w-full h-px bg-slate-100 mb-6"></div>
          <div className="grid grid-cols-2 w-full gap-4">
            <div className="flex flex-col items-center border-r border-slate-50">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 italic text-center">TICKET MÉDIO OPERACIONAL</p>
              <h4 className="text-2xl font-black italic tracking-tighter text-emerald-500">R$ {formatCurrency(data.ticketMedio)}</h4>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 italic text-center">TICKET MÉDIO POR VENDEDOR</p>
              <h4 className="text-2xl font-black italic tracking-tighter text-blue-600">R$ {formatCurrency(data.ticketMedioPorConsultor)}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* VOLUME */}
      <div className="space-y-2">
        <SectionHeader title="MÉTRICAS DE VOLUME OPERACIONAL" colorClass="bg-slate-900" />
        <VolumeGrid totals={data.totals} />
      </div>

      {/* EFICIÊNCIA */}
      <div className="space-y-2">
        <SectionHeader title="EFICIÊNCIA DE CONVERSÃO DO FUNIL" colorClass="bg-blue-600" />
        <EfficiencyGrid efficiency={data.efficiency} />
      </div>

      {/* TABELAS */}
      <div className="space-y-4">
        <SectionHeader title="PERFORMANCE E EFICIÊNCIA POR UNIDADE" colorClass="bg-blue-600" />
        <UnitTable teams={data.teams} />

        <SectionHeader title="RANKING INDIVIDUAL DE PERFORMANCE" colorClass="bg-emerald-500" />
        <RankingTable consultants={data.consultants} />
      </div>

      {/* DIAGNÓSTICO IA */}
      {diagnosis && (
        <div className="bg-[#020617] rounded-[1.5rem] p-8 text-white border-l-[8px] border-blue-600 relative overflow-hidden shadow-2xl page-break-avoid no-print">
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <Sparkles className="text-blue-400" size={20} />
            <h4 className="text-xs font-black uppercase tracking-[0.3em] italic">INSIGHTS PREDITIVOS (IA CORE)</h4>
          </div>
          <div className="text-[11px] leading-relaxed font-medium italic opacity-90 space-y-3 max-w-5xl relative z-10">
            {diagnosis.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`min-h-screen ${view === 'report' ? 'bg-[#f1f5f9]' : 'bg-[#f8fafc]'}`}>
      <nav className="bg-[#020617] text-white px-10 py-5 flex justify-between items-center sticky top-0 z-50 shadow-2xl no-print">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/40"><Activity size={24} /></div>
          <div className="flex flex-col">
            <span className="font-black text-2xl tracking-tighter italic uppercase leading-none">GENESIS HUB</span>
            <span className="text-[9px] font-bold text-blue-400 tracking-[0.4em] uppercase mt-1">SPECIALIST SALES OPS</span>
          </div>
        </div>
        <div className="flex gap-4">
          {data && view === 'dashboard' && (
            <button onClick={() => setView('report')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
              <Printer size={16} /> MODO RELATÓRIO
            </button>
          )}
          {view === 'report' && (
            <>
              <button onClick={handleDownloadPdf} disabled={isDownloading} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all">
                {isDownloading ? <RefreshCw className="animate-spin" size={16} /> : <Download size={16} />} DOWNLOAD
              </button>
              <button onClick={() => setView('dashboard')} className="bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all border border-white/10">
                <ArrowLeft size={16} /> VOLTAR
              </button>
            </>
          )}
          {view === 'dashboard' && (
            <>
              <button onClick={handleDemo} className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all">
                <Lightbulb size={16} className="text-yellow-400" /> DEMO
              </button>
              <button onClick={handleReset} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"><RefreshCw size={18} /></button>
            </>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-10">
        {!data ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 no-print">
            <div className="lg:col-span-8">
              <div className="glass-card p-10 border-t-4 border-blue-600">
                <div className="flex items-center gap-3 mb-8">
                  <FileText className="text-blue-600" size={24} />
                  <h2 className="font-black text-sm uppercase tracking-[0.2em] text-slate-800 italic">DADOS DO FUNIL</h2>
                </div>
                <textarea value={rawText} onChange={(e) => setRawText(e.target.value)} placeholder="Cole aqui os dados das equipes..." className="w-full h-80 bg-slate-50/50 border-2 border-slate-100 rounded-[2rem] p-8 text-sm focus:border-blue-600/30 outline-none font-bold italic transition-all resize-none shadow-inner" />
              </div>
            </div>
            <div className="lg:col-span-4">
              <div className="glass-card p-10 border-t-4 border-emerald-500 h-full">
                <div className="flex items-center gap-3 mb-8">
                  <DollarSign className="text-emerald-500" size={24} />
                  <h2 className="font-black text-sm uppercase tracking-[0.2em] text-slate-800 italic">VGV (FATURAMENTO)</h2>
                </div>
                <textarea value={vgvText} onChange={(e) => setVgvText(e.target.value)} placeholder="NOME: VALOR..." className="w-full h-80 bg-slate-50/50 border-2 border-slate-100 rounded-[2rem] p-8 text-sm focus:border-emerald-500/30 outline-none font-bold italic transition-all resize-none shadow-inner" />
              </div>
            </div>
            <div className="lg:col-span-12">
               <button onClick={handleProcess} className="w-full py-7 bg-[#020617] text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.5em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 active:scale-[0.98] border-b-8 border-blue-700">
                <TrendingUp size={24} /> COMPILAR DADOS ESTRATÉGICOS
              </button>
            </div>
          </div>
        ) : (
          <div className={view === 'report' ? 'bg-white p-10 printable-content max-w-[210mm] mx-auto shadow-2xl rounded-[1rem]' : 'animate-in fade-in slide-in-from-bottom-6 duration-700'}>
            <div ref={reportRef} className="bg-white">
              <div className="mt-4 mb-8 text-center page-break-avoid">
                <h1 className="text-2xl md:text-3xl font-black text-[#0f172a] uppercase tracking-tighter italic border-b-[4px] border-[#0f172a] pb-2 inline-block px-8 leading-tight">RELATÓRIO CONSOLIDADO DE PERFORMANCE</h1>
                <p className="text-slate-400 font-bold text-[11px] mt-4 tracking-[0.6em] uppercase italic opacity-60">
                  {data.reportDate.split('').join(' ')}
                </p>
              </div>

              {view === 'dashboard' && (
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 no-print">
                  <div className="text-center md:text-left">
                    <h2 className="text-4xl font-black text-[#020617] tracking-tighter italic uppercase leading-none">PERFORMANCE CORE</h2>
                    <p className="text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.3em]">CONSORTIUM HUB • {data.reportDate}</p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={handleAiDiagnosis} disabled={loadingAi} className="bg-indigo-50 text-indigo-700 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-3 border-2 border-indigo-100">
                      {loadingAi ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />} DIAGNÓSTICO IA
                    </button>
                  </div>
                </div>
              )}

              <DashboardContent data={data} />

              <footer className="mt-12 pt-6 text-center border-t border-slate-100 opacity-30 italic font-black text-[8px] uppercase tracking-[0.4em] text-slate-400">
                GENESIS INTELLIGENT CORE PROTOCOL • OPERATIONAL SCALING PROTOCOL • {data.reportDate}
              </footer>
            </div>
          </div>
        )}
      </main>
      <div className="h-32"></div>
    </div>
  );
};

export default App;
