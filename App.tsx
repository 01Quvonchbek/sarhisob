
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  LayoutGrid, 
  History, 
  Sparkles, 
  Settings as SettingsIcon,
  TrendingDown,
  TrendingUp,
  Calendar,
  Wallet,
  Bell,
  Trash2,
  PiggyBank,
  CheckCircle2,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { Transaction, TransactionType, Category, UserSettings } from './types';
import { getFinancialAdvice } from './services/geminiService';

const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6', '#AF52DE', '#FFCC00', '#8E8E93'];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'analytics' | 'settings'>('dashboard');
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('sarhisob_v1_tx');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('sarhisob_v1_settings');
      return saved ? JSON.parse(saved) : { salary: 0, currency: "so'm" };
    } catch { return { salary: 0, currency: "so'm" }; }
  });

  const [isAdding, setIsAdding] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    localStorage.setItem('sarhisob_v1_tx', JSON.stringify(transactions));
    localStorage.setItem('sarhisob_v1_settings', JSON.stringify(settings));
  }, [transactions, settings]);

  const summary = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const monthlyTxs = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const fixedCosts = monthlyTxs.filter(t => 
      t.type === TransactionType.CREDIT || 
      t.type === TransactionType.DEBT || 
      t.type === TransactionType.UTILITY
    ).reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthlyTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    const income = monthlyTxs.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const remainingDays = Math.max(1, lastDayOfMonth - today.getDate() + 1);
    
    const netDisposable = settings.salary - fixedCosts;
    const dailyLimit = (netDisposable - expenses) / remainingDays;

    const categoryData = Object.values(Category).map(cat => {
      const amount = monthlyTxs
        .filter(t => t.category === cat && (t.type === TransactionType.EXPENSE || t.type === TransactionType.CREDIT))
        .reduce((sum, t) => sum + t.amount, 0);
      return { name: cat, value: amount };
    }).filter(d => d.value > 0);

    return { 
      fixedCosts, 
      expenses, 
      income, 
      dailyLimit: Math.max(0, dailyLimit), 
      remainingDays,
      totalSpent: expenses + fixedCosts,
      balance: settings.salary + income - expenses - fixedCosts,
      categoryData
    };
  }, [transactions, settings]);

  const reminders = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return transactions.filter(t => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays >= 0;
    });
  }, [transactions]);

  const handleAdd = (tx: Partial<Transaction>) => {
    if (!tx.amount) return;
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      amount: Number(tx.amount),
      type: tx.type!,
      category: tx.category || Category.OTHERS,
      date: tx.date || new Date().toISOString().split('T')[0],
      description: tx.description || '',
      isRecurring: tx.isRecurring || false,
      dueDate: tx.dueDate
    };
    setTransactions([newTransaction, ...transactions]);
    setIsAdding(false);
  };

  const getAdvice = async () => {
    setLoadingAI(true);
    try {
      const res = await getFinancialAdvice(transactions, settings);
      setAiAdvice(res || '');
    } catch {
      setAiAdvice("Xatolik yuz berdi. Iltimos keyinroq urinib ko'ring.");
    }
    setLoadingAI(false);
  };

  return (
    <div className="h-screen bg-[#F2F2F7] flex flex-col overflow-hidden">
      <div className="h-[env(safe-area-inset-top,20px)] bg-[#F2F2F7]/95 backdrop-blur-2xl fixed top-0 left-0 right-0 z-[60]"></div>

      <main className="flex-1 overflow-y-auto px-5 pb-32 pt-10">
        <header className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-[10px] font-black text-[#8E8E93] uppercase tracking-[0.2em] mb-1">Sarhisob AI</h2>
            <h1 className="text-4xl font-extrabold tracking-tighter text-[#1C1C1E]">
              {activeTab === 'dashboard' ? 'Asosiy' : 
               activeTab === 'history' ? 'Tarix' : 
               activeTab === 'analytics' ? 'Tahlil' : 'Admin'}
            </h1>
          </div>
          {activeTab === 'dashboard' && (
            <button 
              onClick={() => setIsAdding(true)} 
              className="bg-[#007AFF] text-white w-14 h-14 rounded-full shadow-lg shadow-[#007AFF]/30 flex items-center justify-center active:scale-95 transition-transform"
            >
              <Plus size={32} />
            </button>
          )}
        </header>

        <div className="transition-all duration-300">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2.8rem] shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 opacity-[0.03] text-black"><Wallet size={180} /></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-10">
                    <div>
                      <p className="text-[11px] font-black text-[#8E8E93] uppercase tracking-widest mb-1">Bugun mumkin</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-[900] text-[#1C1C1E] tracking-tighter">{Math.round(summary.dailyLimit).toLocaleString()}</span>
                        <span className="text-xl font-bold text-[#8E8E93]">{settings.currency}</span>
                      </div>
                    </div>
                    <div className="bg-[#34C759]/10 p-3 rounded-2xl"><PiggyBank className="text-[#34C759]" size={24} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#F2F2F7] rounded-[1.8rem] p-5">
                      <p className="text-[9px] text-[#8E8E93] font-black uppercase tracking-wider mb-1">Balans</p>
                      <p className={`text-lg font-black ${summary.balance >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>{summary.balance.toLocaleString()}</p>
                    </div>
                    <div className="bg-[#F2F2F7] rounded-[1.8rem] p-5">
                      <p className="text-[9px] text-[#8E8E93] font-black uppercase tracking-wider mb-1">Jami Sarf</p>
                      <p className="text-lg font-black text-[#FF3B30]">{summary.totalSpent.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {reminders.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-black text-sm text-[#8E8E93] uppercase tracking-widest px-2">Eslatmalar</h3>
                  {reminders.map(r => (
                    <div key={r.id} className="bg-[#FF3B30] p-5 rounded-[2.2rem] flex gap-4 items-center shadow-lg">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white"><Bell size={20} /></div>
                      <div className="flex-1 text-white">
                        <h4 className="font-black text-sm">{r.category}</h4>
                        <p className="text-[11px] opacity-80 font-bold">Muddat: {r.dueDate}</p>
                      </div>
                      <div className="text-white font-black text-sm">{r.amount.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-[2.2rem] shadow-sm">
                   <div className="w-10 h-10 bg-[#5856D6]/10 text-[#5856D6] rounded-2xl flex items-center justify-center mb-3"><TrendingDown size={20}/></div>
                   <p className="text-[9px] font-black text-[#8E8E93] uppercase mb-1">Qarz/Kredit</p>
                   <p className="text-lg font-black text-[#1C1C1E]">{summary.fixedCosts.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-[2.2rem] shadow-sm">
                   <div className="w-10 h-10 bg-[#FF9500]/10 text-[#FF9500] rounded-2xl flex items-center justify-center mb-3"><Calendar size={20}/></div>
                   <p className="text-[9px] font-black text-[#8E8E93] uppercase mb-1">Kun qoldi</p>
                   <p className="text-lg font-black text-[#1C1C1E]">{summary.remainingDays} kun</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden p-2">
              {transactions.length > 0 ? (
                transactions.map((tx, idx) => (
                  <TransactionRow key={tx.id} tx={tx} isLast={idx === transactions.length - 1} onDelete={() => setTransactions(transactions.filter(t => t.id !== tx.id))} />
                ))
              ) : (
                <div className="py-20 text-center text-[#8E8E93] font-bold">Tarix bo'sh</div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2.8rem] shadow-sm">
                <h3 className="font-black text-sm uppercase tracking-widest text-[#8E8E93] mb-6 flex items-center gap-2">
                  <PieChartIcon size={18}/> Xarajatlar tahlili
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={summary.categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {summary.categoryData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-[#1C1C1E] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <Sparkles className="absolute -bottom-10 -right-10 text-white/5" size={200} />
                <h3 className="text-2xl font-black mb-6">AI Mentor</h3>
                <button onClick={getAdvice} disabled={loadingAI} className="w-full bg-white text-black py-5 rounded-[1.8rem] font-bold active:scale-95 transition-transform disabled:opacity-50">
                  {loadingAI ? 'Tahlil...' : 'Maslahat olish'}
                </button>
                {aiAdvice && <div className="mt-8 p-6 bg-white/10 rounded-2xl text-[14px] leading-relaxed font-medium">{aiAdvice}</div>}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white p-8 rounded-[2.8rem] shadow-sm space-y-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-[#8E8E93] uppercase tracking-widest px-1">Oylik Daromad</label>
                <div className="relative">
                  <input type="number" value={settings.salary || ''} onChange={(e) => setSettings({...settings, salary: Number(e.target.value)})} placeholder="0" className="w-full bg-[#F2F2F7] border-none rounded-[1.8rem] p-6 font-black text-3xl text-[#1C1C1E]" />
                  <span className="absolute right-8 top-1/2 -translate-y-1/2 font-bold text-[#8E8E93] text-xl">{settings.currency}</span>
                </div>
              </div>
              <div className="bg-[#F2F2F7] p-6 rounded-[1.8rem] text-center">
                 <p className="text-[10px] font-black text-[#8E8E93] uppercase mb-1">Status</p>
                 <p className="text-sm font-black text-[#1C1C1E]">Netlify Optimized v2.0</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 ios-blur safe-bottom border-t border-[#D1D1D6]/20 px-8 pt-3 flex justify-between items-center z-50 h-[92px]">
        <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutGrid size={26} />} label="Sarhisob" />
        <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={26} />} label="Tarix" />
        <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<BarChart3 size={26} />} label="Tahlil" />
        <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={26} />} label="Admin" />
      </nav>

      {isAdding && <AddTransactionModal onSave={handleAdd} onClose={() => setIsAdding(false)} settings={settings} />}
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${active ? 'text-[#007AFF] scale-110' : 'text-[#8E8E93] scale-100'}`}>
    <div className="relative">{icon}</div>
    <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
  </button>
);

const TransactionRow = ({ tx, isLast, onDelete }: any) => (
  <div className={`flex items-center justify-between p-5 ${!isLast ? 'border-b border-[#F2F2F7]' : ''}`}>
    <div className="flex items-center gap-4">
      <div className={`p-4 rounded-[1.2rem] bg-gray-100`}>{tx.type === TransactionType.INCOME ? <TrendingUp size={18} className="text-green-500" /> : <TrendingDown size={18} className="text-red-500" />}</div>
      <div>
        <p className="font-extrabold text-[15px] text-[#1C1C1E]">{tx.category}</p>
        <p className="text-[10px] font-black text-[#8E8E93] uppercase">{tx.date}</p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className={`font-black text-[16px] ${tx.type === TransactionType.INCOME ? 'text-green-500' : 'text-black'}`}>{tx.type === TransactionType.INCOME ? '+' : '-'}{tx.amount.toLocaleString()}</p>
      </div>
      <button onClick={onDelete} className="text-[#D1D1D6] p-2 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
    </div>
  </div>
);

const AddTransactionModal = ({ onSave, onClose, settings }: any) => {
  const [tx, setTx] = useState({ amount: '', type: TransactionType.EXPENSE, category: Category.FOOD, date: new Date().toISOString().split('T')[0], dueDate: '' });
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-lg rounded-t-[3rem] p-10 pb-14 shadow-2xl relative z-10 safe-bottom">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8"></div>
        <div className="space-y-8 mb-12">
           <div className="flex gap-2 p-1.5 bg-[#F2F2F7] rounded-[1.8rem]">
             {[TransactionType.EXPENSE, TransactionType.INCOME, TransactionType.CREDIT, TransactionType.DEBT].map(t => (
               <button key={t} onClick={() => setTx({...tx, type: t})} className={`flex-1 py-3 rounded-[1.4rem] text-[10px] font-black uppercase transition-all ${tx.type === t ? 'bg-white text-[#007AFF] shadow-md' : 'text-[#8E8E93]'}`}>
                 {t}
               </button>
             ))}
           </div>
           <div className="border-b-4 border-[#F2F2F7] pb-4">
             <input type="number" placeholder="Summa..." value={tx.amount} onChange={e => setTx({...tx, amount: e.target.value})} className="w-full text-5xl font-black bg-transparent border-none focus:ring-0" autoFocus />
           </div>
           <div className="grid grid-cols-2 gap-5">
              <select value={tx.category} onChange={e => setTx({...tx, category: e.target.value as Category})} className="w-full bg-[#F2F2F7] border-none rounded-[1.5rem] p-5 font-bold text-sm">
                {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="date" value={tx.date} onChange={e => setTx({...tx, date: e.target.value})} className="w-full bg-[#F2F2F7] border-none rounded-[1.5rem] p-5 font-bold text-sm" />
           </div>
           {(tx.type === TransactionType.CREDIT || tx.type === TransactionType.DEBT) && (
              <div className="bg-red-50 p-6 rounded-[2rem]">
                <label className="text-[11px] font-black text-red-500 uppercase mb-3 block">To'lov muddati</label>
                <input type="date" value={tx.dueDate} onChange={e => setTx({...tx, dueDate: e.target.value})} className="w-full bg-white border-none rounded-[1.2rem] p-5 text-red-500" />
              </div>
           )}
        </div>
        <button onClick={() => onSave(tx)} className="w-full bg-[#007AFF] text-white py-6 rounded-[2.2rem] font-black text-xl active:scale-95 transition-transform shadow-xl">Saqlash</button>
      </div>
    </div>
  );
}

export default App;
