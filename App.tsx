
import React, { useState, useEffect } from 'react';
import { 
  FileText, TrendingUp, Users, DollarSign, Printer, Cpu, RefreshCw,
  Wallet, PieChart, Activity, Target, Zap, ArrowLeft
} from 'lucide-react';
import { DashboardData } from './types';
import { parseRawData } from './utils/parser';
import { getFunnelDiagnosis } from './services/geminiService';

const App: React.FC = () => {
  const [rawText, setRawText] = useState<string>('');
  const [vgvText, setVgvText] = useState<string>('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [view, setView] = useState<'dashboard' | 'report'>('dashboard');

  // Efeito para disparar a impressão automaticamente ao entrar no modo relatório
  useEffect(() => {
    if (view === 'report' && data) {
      // Pequeno delay para garantir que o DOM renderizou completamente as tabelas antes de abrir o PDF
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [view, data]);

  const handleProcess = () => {
    if (!rawText.trim() && !vgvText.trim()) return;
    const result = parseRawData(rawText, vgvText);
    setData(result);
    setDiagnosis('');
  };

  const handleAiDiagnosis = async () => {
    if (!data) return;
    setLoadingAi(true);
    const text = await getFunnelDiagnosis(data);
    setDiagnosis(text);
    setLoadingAi(false);
  };

  const handlePrintTrigger = () => {
    if (!data) return;
    setView('report');
  };

  const handleReset = () => {
    setRawText('');
    setVgvText('');
    setData(null);
    setDiagnosis('');
    setView('dashboard');
    setLoadingAi(false);
  };

  const ReportView = ({ data }: { data: DashboardData }) => (
    <div className="bg-white min-h-screen p-8 printable-content">
      {/* Cabeçalho de Controle (Não sai no PDF) */}
      <div className="no-print bg-slate-900 text-white px-8 py-5 flex justify-between items-center -mx-8 -mt-8 mb-10 shadow-2xl sticky top-0 z-[100]">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg"><Activity size={18} /></div>
          <span className="font-black text-sm uppercase italic tracking-tighter">Genesis Protocol • Relatório Executivo</span>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => window.print()} 
            className="bg-blue-600 px-6 py-2.5 rounded-xl font-black text-xs text-white hover:bg-blue-500 transition-all shadow-lg active:scale-95 flex items-center gap-2"
          >
            <Printer size={16} /> IMPRIMIR PDF
          </button>
          <button 
            onClick={() => setView('dashboard')} 
            className="bg-white/10 px-6 py-2.5 rounded-xl font-black text-xs text-white hover:bg-white/20 transition-all flex items-center gap-2"
          >
            <ArrowLeft size={16} /> VOLTAR
          </button>
        </div>
      </div>

      <div className="text-center mb-8 border-b-4 border-black pb-6">
        <h1 className="text-4xl font-black tracking-tighter mb-1 uppercase italic">Relatório Consolidado de Performance</h1>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em]">{data.reportDate}</p>
      </div>

      {/* 1. FATURAMENTO E TICKETS (PDF) */}
      <div className="border-[3px] border-black rounded-[2.5rem] p-8 text-center mb-6 bg-slate-50">
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] mb-2 italic">Faturamento Consolidado Global</p>
        <h2 className="text-5xl font-black mb-8 italic">R$ {data.totals.vgv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
        
        <div className="grid grid-cols-2 gap-8 border-t-2 border-slate-200 pt-6">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest italic leading-none">Ticket Médio Operacional</p>
            <p className="text-2xl font-black italic text-emerald-600">R$ {data.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest italic leading-none">Ticket Médio por Vendedor</p>
            <p className="text-2xl font-black italic text-blue-600">R$ {data.ticketMedioPorConsultor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* 2. VOLUME GERAL (PDF) */}
      <div className="mb-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-3 border-l-[5px] border-slate-900 pl-3 italic">Métricas de Volume Operacional</h3>
        <div className="grid grid-cols-5 gap-3">
          {[
            { l: 'Anúncios', v: data.totals.ads },
            { l: 'Ligações', v: data.totals.calls },
            { l: 'Agendamentos', v: data.totals.appointments },
            { l: 'Visitas', v: data.totals.visits },
            { l: 'Fechamentos', v: data.totals.closings }
          ].map((m, idx) => (
            <div key={idx} className="bg-white border-2 border-slate-100 p-4 rounded-2xl text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{m.l}</p>
              <p className="text-2xl font-black italic">{m.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. EFICIÊNCIA GERAL (PDF) */}
      <div className="mb-10">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-3 border-l-[5px] border-blue-600 pl-3 italic">Eficiência de Conversão do Funil</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { l: 'Anúncios/Lead', v: data.efficiency.adsToCall },
            { l: 'Ligação/Agend.', v: data.efficiency.callToAppointment },
            { l: 'Agend./Visita', v: data.efficiency.appointmentToVisit },
            { l: 'Visita/Fech.', v: data.efficiency.visitToClosing }
          ].map((eff, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{eff.l}</p>
              <p className="text-2xl font-black italic text-blue-700">{eff.v.toFixed(1)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. PERFORMANCE POR UNIDADE COMPLETA (PDF) */}
      <div className="mb-10 overflow-hidden">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 border-l-[5px] border-blue-600 pl-3 italic text-blue-600">Performance e Eficiência por Unidade</h3>
        <table className="w-full text-[7.5px] border-collapse border border-slate-200">
          <thead className="bg-slate-900 text-white italic uppercase font-black">
            <tr>
              <th className="p-2 border border-slate-700 text-left">Equipe</th>
              <th className="p-2 border border-slate-700 text-center">ANN</th>
              <th className="p-2 border border-slate-700 text-center">LIG</th>
              <th className="p-2 border border-slate-700 text-center">AGD</th>
              <th className="p-2 border border-slate-700 text-center">VIS</th>
              <th className="p-2 border border-slate-700 text-center">FCH</th>
              <th className="p-2 border border-slate-700 text-right bg-slate-800">VGV Total</th>
              <th className="p-2 border border-slate-700 text-center text-blue-300">A/L</th>
              <th className="p-2 border border-slate-700 text-center text-blue-300">L/A</th>
              <th className="p-2 border border-slate-700 text-center text-blue-300">A/V</th>
              <th className="p-2 border border-slate-700 text-center text-blue-300">V/F</th>
            </tr>
          </thead>
          <tbody className="font-bold uppercase italic divide-y divide-slate-100">
            {data.teams.map((t, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="p-2 border border-slate-200 text-slate-900 font-black">{t.teamName}</td>
                <td className="p-2 border border-slate-200 text-center text-slate-400">{t.totals.ads}</td>
                <td className="p-2 border border-slate-200 text-center text-slate-400">{t.totals.calls}</td>
                <td className="p-2 border border-slate-200 text-center text-slate-400">{t.totals.appointments}</td>
                <td className="p-2 border border-slate-200 text-center text-slate-400">{t.totals.visits}</td>
                <td className="p-2 border border-slate-200 text-center text-slate-950 font-black">{t.totals.closings}</td>
                <td className="p-2 border border-slate-200 text-right text-emerald-600 font-black whitespace-nowrap">R$ {t.totals.vgv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td className="p-2 border border-slate-200 text-center text-blue-600">{t.efficiency.adsToCall}</td>
                <td className="p-2 border border-slate-200 text-center text-blue-600">{t.efficiency.callToAppointment}</td>
                <td className="p-2 border border-slate-200 text-center text-blue-600">{t.efficiency.appointmentToVisit}</td>
                <td className="p-2 border border-slate-200 text-center text-blue-600 font-black bg-blue-50/50">{t.efficiency.visitToClosing}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 5. RANKING INDIVIDUAL COMPLETO (PDF) */}
      <div className="mb-8">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 border-l-[5px] border-emerald-600 pl-3 italic text-emerald-600">Ranking Individual de Performance</h3>
        <table className="w-full text-[6.5px] border-collapse border border-slate-200">
          <thead className="bg-slate-100 text-slate-600 italic uppercase font-black">
            <tr>
              <th className="p-1.5 border border-slate-300 text-left">Vendedor [Equipe]</th>
              <th className="p-1.5 border border-slate-300 text-center">ANN</th>
              <th className="p-1.5 border border-slate-300 text-center">LIG</th>
              <th className="p-1.5 border border-slate-300 text-center">AGD</th>
              <th className="p-1.5 border border-slate-300 text-center">VIS</th>
              <th className="p-1.5 border border-slate-300 text-center text-black">FCH</th>
              <th className="p-1.5 border border-slate-300 text-right bg-emerald-50 text-emerald-600">VGV Total</th>
              <th className="p-1.5 border border-slate-300 text-center text-blue-500">A/L</th>
              <th className="p-1.5 border border-slate-300 text-center text-blue-500">L/A</th>
              <th className="p-1.5 border border-slate-300 text-center text-blue-500">A/V</th>
              <th className="p-1.5 border border-slate-300 text-center text-blue-500">V/F</th>
            </tr>
          </thead>
          <tbody className="font-bold uppercase italic divide-y divide-slate-100">
            {data.consultants.sort((a,b) => b.vgv - a.vgv).map((c, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                <td className="p-1.5 border border-slate-200 text-slate-900 font-black truncate max-w-[90px]">
                  {c.name} <span className="text-[5px] text-slate-400">[{c.team}]</span>
                </td>
                <td className="p-1.5 border border-slate-200 text-center text-slate-300">{c.ads}</td>
                <td className="p-1.5 border border-slate-200 text-center text-slate-300">{c.calls}</td>
                <td className="p-1.5 border border-slate-200 text-center text-slate-400">{c.appointments}</td>
                <td className="p-1.5 border border-slate-200 text-center text-slate-400">{c.visits}</td>
                <td className="p-1.5 border border-slate-200 text-center text-slate-950 font-black">{c.closings}</td>
                <td className="p-1.5 border border-slate-200 text-right text-emerald-600 font-black whitespace-nowrap">R$ {c.vgv.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</td>
                <td className="p-1.5 border border-slate-200 text-center text-blue-500">{c.adsToCall}</td>
                <td className="p-1.5 border border-slate-200 text-center text-blue-500">{c.callToAppointment}</td>
                <td className="p-1.5 border border-slate-200 text-center text-blue-500">{c.appointmentToVisit}</td>
                <td className="p-1.5 border border-slate-200 text-center text-blue-700 font-black bg-blue-50/30">{c.visitToClosing}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="mt-auto pt-8 text-center border-t-2 border-slate-100 text-[8px] font-black text-slate-300 uppercase tracking-[0.8em] italic">
        Genesis Intelligent Core Protocol • Operational scaling protocol • {data.reportDate}
      </footer>
    </div>
  );

  return (
    <div className={`min-h-screen ${view === 'report' ? 'bg-white' : 'bg-[#f8fafc] pb-20'}`}>
      {view === 'report' && data ? (
        <ReportView data={data} />
      ) : (
        <>
          <nav className="bg-[#0a1128] text-white px-8 py-4 flex justify-between items-center shadow-2xl sticky top-0 z-50 border-b border-white/10 no-print">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20"><Activity size={22} /></div>
              <div className="flex flex-col">
                <span className="font-black text-2xl tracking-tighter italic leading-none">GENESIS</span>
                <span className="text-[8px] font-bold text-blue-400 tracking-[0.3em] uppercase mt-1">Operations Protocol</span>
              </div>
            </div>
            <button 
              onClick={handleReset} 
              className="p-2.5 bg-white/5 hover:bg-white/15 rounded-xl transition-all active:scale-95 border border-white/5 cursor-pointer flex items-center justify-center"
              title="Recarregar Sistema (Limpar Tudo)"
            >
              <RefreshCw size={18} />
            </button>
          </nav>

          <main className="max-w-7xl mx-auto px-6 mt-10 space-y-12 no-print">
            {/* Input Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="glass-card p-10 border-t-[8px] border-t-blue-600 shadow-xl transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-blue-50 p-2.5 rounded-xl"><FileText className="text-blue-600" size={24} /></div>
                  <h2 className="font-black text-lg uppercase italic text-slate-900">Input de Relatórios</h2>
                </div>
                <textarea 
                  value={rawText} onChange={(e) => setRawText(e.target.value)} 
                  placeholder="Cole relatórios do WhatsApp aqui..." 
                  className="w-full h-40 bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 text-sm focus:border-blue-600 outline-none font-medium resize-none transition-all shadow-inner"
                />
                <button onClick={handleProcess} className="w-full mt-6 py-5 bg-[#0a1128] text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3">
                  <TrendingUp size={20} /> PROCESSAR DADOS
                </button>
              </div>

              <div className="glass-card p-10 border-t-[8px] border-t-emerald-500 shadow-xl transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-emerald-50 p-2.5 rounded-xl"><DollarSign className="text-emerald-600" size={24} /></div>
                  <h2 className="font-black text-lg uppercase italic text-slate-900">VGV Individual</h2>
                </div>
                <textarea 
                  value={vgvText} onChange={(e) => setVgvText(e.target.value)} 
                  placeholder="Ex: RICHARLYSSON 300k..." 
                  className="w-full h-40 bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 text-sm focus:border-emerald-600 outline-none font-medium resize-none transition-all shadow-inner"
                />
                <button onClick={handleProcess} className="w-full mt-6 py-5 bg-emerald-500 text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3">
                  <Wallet size={20} /> COMPUTAR VGV
                </button>
              </div>
            </section>

            {data && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
                {/* Header Dashboard */}
                <div className="flex flex-col lg:flex-row justify-between items-end gap-8 bg-white/60 backdrop-blur-md p-10 rounded-[4rem] border border-white shadow-sm">
                  <div className="text-center lg:text-left">
                    <p className="text-[12px] font-black text-blue-600 uppercase tracking-[0.6em] mb-2 italic leading-none">Consórcio Hub Intelligence</p>
                    <h2 className="text-5xl md:text-6xl font-black text-slate-950 tracking-tighter italic uppercase leading-none">
                      Dashboard Geral <span className="text-slate-300 px-3">•</span> {data.reportDate}
                    </h2>
                  </div>
                  <div className="flex gap-4 mb-1">
                    <button onClick={handleAiDiagnosis} className="bg-white border-2 border-slate-200 px-8 py-5 rounded-[2.2rem] text-[11px] font-black uppercase tracking-widest shadow-xl hover:border-yellow-400 hover:shadow-yellow-100 transition-all active:scale-95 flex items-center justify-center gap-2">
                      <span className="text-lg">✨</span> {loadingAi ? 'ANALISANDO...' : 'DIAGNÓSTICO IA'}
                    </button>
                    <button onClick={handlePrintTrigger} className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-[2.2rem] text-[11px] font-black uppercase tracking-[0.1em] shadow-2xl shadow-blue-600/40 border-b-[6px] border-b-blue-900 transition-all flex items-center justify-center gap-3 active:scale-95">
                      <Printer size={22} /> GERAR PDF EXECUTIVO
                    </button>
                  </div>
                </div>

                {/* 1. FATURAMENTO GLOBAL */}
                <div className="bg-[#0a1128] rounded-[5rem] p-16 lg:p-24 text-white flex flex-col items-center justify-center gap-14 shadow-[0_60px_100px_-20px_rgba(10,17,40,0.6)] relative overflow-hidden border-[15px] border-white group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/25 via-transparent to-emerald-500/15 opacity-70"></div>
                  
                  <div className="flex flex-col items-center gap-6 relative z-10 w-full">
                    <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center shadow-[0_25px_60px_rgba(37,99,235,0.6)] shrink-0 mb-4 group-hover:rotate-6 transition-transform duration-500">
                      <DollarSign size={56} className="text-white" />
                    </div>
                    <p className="text-[16px] font-black uppercase tracking-[1em] text-blue-400/80 italic leading-none">Faturamento Consolidado Global</p>
                    <h3 className="text-7xl md:text-9xl font-black tracking-tighter italic leading-none whitespace-nowrap drop-shadow-2xl">
                      R$ {data.totals.vgv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                  </div>

                  {/* 2. TICKETS ABAIXO */}
                  <div className="relative z-10 w-full flex flex-col md:flex-row justify-center gap-8 px-10">
                    <div className="bg-slate-900/60 backdrop-blur-3xl px-12 py-8 rounded-[3.5rem] border border-white/10 shadow-3xl text-center flex-1 group-hover:border-white/30 transition-all">
                      <p className="text-[12px] font-black uppercase tracking-[0.5em] text-slate-400 mb-3 italic leading-tight text-center">Ticket Médio<br/>Operacional</p>
                      <p className="text-4xl lg:text-5xl font-black italic text-emerald-400 leading-none">
                        R$ {data.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="bg-slate-900/40 backdrop-blur-2xl px-12 py-8 rounded-[3.5rem] border border-white/5 shadow-xl text-center flex-1 group-hover:border-white/20 transition-all">
                      <p className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-500 mb-3 italic leading-tight text-center">Ticket Médio<br/>por Vendedor</p>
                      <p className="text-3xl lg:text-4xl font-black italic text-emerald-100 leading-none">
                        R$ {data.ticketMedioPorConsultor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. VOLUME OPERACIONAL (ANN, LIG, AGD, VIS, FCH) */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8 px-2">
                  {[
                    { l: 'Anúncios', v: data.totals.ads, c: 'text-slate-400' },
                    { l: 'Ligações', v: data.totals.calls, c: 'text-blue-500' },
                    { l: 'Agendamentos', v: data.totals.appointments, c: 'text-indigo-500' },
                    { l: 'Visitas', v: data.totals.visits, c: 'text-purple-500' },
                    { l: 'Fechamentos', v: data.totals.closings, c: 'text-emerald-500' }
                  ].map((k, i) => (
                    <div key={i} className="bg-white/90 border-[6px] border-white/20 p-10 rounded-[2.5rem] text-center shadow-[15px_15px_35px_rgba(0,0,0,0.08)] group hover:-translate-y-2 transition-all">
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-5 italic text-center">{k.l}</p>
                      <p className={`text-6xl font-black italic ${k.c} tracking-tighter text-center`}>{k.v}</p>
                    </div>
                  ))}
                </div>

                {/* 4. EFICIÊNCIA DO FUNIL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { l: 'Anúncios / 1 Ligação', v: data.efficiency.adsToCall, d: 'Volume por Lead' },
                    { l: 'Ligações / 1 Agend.', v: data.efficiency.callToAppointment, d: 'Conversão Contato' },
                    { l: 'Agend. / 1 Visita', v: data.efficiency.appointmentToVisit, d: 'Taxa de Comparecimento' },
                    { l: 'Visitas / 1 Fech.', v: data.efficiency.visitToClosing, d: 'Eficiência de Mesa' }
                  ].map((eff, idx) => (
                    <div key={idx} className="bg-white/80 border-4 border-white rounded-[3rem] p-10 text-center shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] transition-all hover:scale-105 group">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 italic leading-tight group-hover:text-blue-500 transition-colors">{eff.l}</p>
                      <p className="text-7xl font-black text-slate-950 italic tracking-tighter">{eff.v.toFixed(1)}</p>
                      <p className="text-[9px] font-bold text-slate-300 mt-4 uppercase tracking-[0.3em]">{eff.d}</p>
                    </div>
                  ))}
                </div>

                {/* DIAGNÓSTICO IA */}
                {diagnosis && (
                  <div className="glass-card p-14 border-l-[20px] border-l-blue-600 bg-blue-50/5 shadow-2xl animate-in zoom-in-95 duration-500">
                    <div className="flex items-center gap-5 mb-8">
                      <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-xl"><Cpu size={32} /></div>
                      <h3 className="font-black uppercase tracking-[0.4em] text-xl text-blue-950 italic underline decoration-4 underline-offset-8">Estratégia Sales Ops Core</h3>
                    </div>
                    <p className="text-xl text-slate-800 leading-relaxed font-semibold italic opacity-95 whitespace-pre-line">{diagnosis}</p>
                  </div>
                )}

                {/* PERFORMANCE POR UNIDADE COMPLETA */}
                <div className="glass-card overflow-hidden shadow-3xl border-[12px] border-white">
                  <div className="p-12 border-b-2 border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-blue-600 text-white rounded-[1.8rem] flex items-center justify-center shadow-3xl"><PieChart size={32} /></div>
                      <h3 className="font-black uppercase tracking-[0.4em] text-4xl text-slate-900 italic leading-none">Performance por Unidade</h3>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[#0a1128] text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">
                        <tr>
                          <th className="px-10 py-10 sticky left-0 bg-[#0a1128] z-10">Unidade</th>
                          <th className="px-4 py-10 text-center">ANN</th>
                          <th className="px-4 py-10 text-center">LIG</th>
                          <th className="px-4 py-10 text-center">AGD</th>
                          <th className="px-4 py-10 text-center">VIS</th>
                          <th className="px-4 py-10 text-center text-white">FCH</th>
                          <th className="px-10 py-10 text-right bg-emerald-600 text-white italic">VGV Total</th>
                          <th className="px-4 py-10 text-center text-blue-400 italic">A/L</th>
                          <th className="px-4 py-10 text-center text-blue-400 italic">L/A</th>
                          <th className="px-4 py-10 text-center text-blue-400 italic">A/V</th>
                          <th className="px-4 py-10 text-center text-blue-400 italic">V/F</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-4 divide-slate-50 font-bold uppercase italic text-[16px]">
                        {data.teams.map((t, i) => (
                          <tr key={i} className="group hover:bg-blue-50 transition-colors">
                            <td className="px-10 py-12 sticky left-0 bg-white group-hover:bg-blue-50 transition-all z-10 font-black text-slate-950 tracking-tighter border-r border-slate-50">{t.teamName}</td>
                            <td className="px-4 text-center text-slate-400">{t.totals.ads}</td>
                            <td className="px-4 text-center text-slate-400">{t.totals.calls}</td>
                            <td className="px-4 text-center text-slate-400">{t.totals.appointments}</td>
                            <td className="px-4 text-center text-slate-400">{t.totals.visits}</td>
                            <td className="px-4 text-center">
                              <span className="bg-[#0a1128] text-white px-6 py-2 rounded-xl font-black text-2xl shadow-lg inline-block italic leading-none">{t.totals.closings}</span>
                            </td>
                            <td className="px-10 text-right font-black text-emerald-600 bg-emerald-50/40 text-2xl border-x-4 border-white whitespace-nowrap">R$ {t.totals.vgv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="px-4 text-center font-black text-blue-600 bg-blue-50/10 italic text-xl">{t.efficiency.adsToCall}</td>
                            <td className="px-4 text-center font-black text-blue-600 bg-blue-50/10 italic text-xl">{t.efficiency.callToAppointment}</td>
                            <td className="px-4 text-center font-black text-blue-600 bg-blue-50/10 italic text-xl">{t.efficiency.appointmentToVisit}</td>
                            <td className="px-4 text-center font-black text-blue-600 bg-blue-50/10 italic text-xl">{t.efficiency.visitToClosing}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* RANKING INDIVIDUAL COMPLETO */}
                <div className="glass-card overflow-hidden shadow-3xl border-[12px] border-white">
                  <div className="p-12 border-b-2 border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-[#0a1128] text-white rounded-[1.8rem] flex items-center justify-center shadow-3xl -rotate-3"><Users size={32} /></div>
                      <h3 className="font-black uppercase tracking-[0.4em] text-4xl text-slate-900 italic leading-none">Ranking de Produtividade Individual</h3>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[#0a1128] text-slate-400 font-black uppercase tracking-[0.2em] text-[9px]">
                        <tr>
                          <th className="px-10 py-8 sticky left-0 bg-[#0a1128] z-10">Vendedor</th>
                          <th className="px-4 py-8 text-center">ANN</th>
                          <th className="px-4 py-8 text-center">LIG</th>
                          <th className="px-4 py-8 text-center">AGD</th>
                          <th className="px-4 py-8 text-center">VIS</th>
                          <th className="px-4 py-8 text-center text-white">FCH</th>
                          <th className="px-10 py-8 text-right bg-emerald-900 text-emerald-400 italic">VGV Total</th>
                          <th className="px-4 py-8 text-center text-blue-400 italic">A/L</th>
                          <th className="px-4 py-8 text-center text-blue-400 italic">L/A</th>
                          <th className="px-4 py-8 text-center text-blue-400 italic">A/V</th>
                          <th className="px-4 py-8 text-center text-blue-400 italic">V/F</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-slate-50 font-bold uppercase italic text-[14px]">
                        {data.consultants.sort((a,b) => b.vgv - a.vgv).map((c, i) => (
                          <tr key={i} className="hover:bg-blue-50 transition-colors group">
                            <td className="px-10 py-10 sticky left-0 bg-white group-hover:bg-blue-50 transition-all z-10 border-r border-slate-50 min-w-[200px]">
                              <p className="font-black text-slate-950 tracking-tight text-xl">{c.name}</p>
                              <span className="text-[9px] font-black text-blue-600 tracking-widest bg-blue-50 px-3 py-1 rounded-lg italic leading-none inline-block mt-1">{c.team}</span>
                            </td>
                            <td className="px-4 text-center text-slate-300">{c.ads}</td>
                            <td className="px-4 text-center text-slate-300">{c.calls}</td>
                            <td className="px-4 text-center text-slate-400">{c.appointments}</td>
                            <td className="px-4 text-center text-slate-400">{c.visits}</td>
                            <td className="px-4 text-center font-black text-slate-950 text-xl italic leading-none">{c.closings}</td>
                            <td className="px-10 text-right font-black text-emerald-600 bg-emerald-50/30 text-2xl border-x-4 border-white whitespace-nowrap">R$ {c.vgv.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</td>
                            <td className="px-4 text-center font-black text-blue-600 bg-blue-50/10 italic text-xl">{c.adsToCall}</td>
                            <td className="px-4 text-center font-black text-blue-600 bg-blue-50/10 italic text-xl">{c.callToAppointment}</td>
                            <td className="px-4 text-center font-black text-blue-600 bg-blue-50/10 italic text-xl">{c.appointmentToVisit}</td>
                            <td className="px-4 text-center font-black text-blue-600 bg-blue-50/10 italic text-xl">{c.visitToClosing}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </main>

          <footer className="mt-40 pb-24 text-center opacity-10 no-print">
            <p className="text-[11px] font-black uppercase tracking-[1.5em] text-slate-500 italic">Genesis Hub v10.5 • Strategic Sales Operations Hub</p>
          </footer>
        </>
      )}
    </div>
  );
};

export default App;
