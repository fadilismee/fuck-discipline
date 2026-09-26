import React, { useMemo, useState } from 'react';
import { useLifeOSStore } from '../store/useLifeOSStore';
import { Modal } from '../components/common/Modal';
import { Transaction } from '../types';

type Tab = 'overview' | 'transactions' | 'budget' | 'accounts' | 'targets';

/** Kurva halus (catmull-rom → bezier) dari titik-titik, viewBox 400x64. */
function smoothLine(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M${pts[0].x} ${pts[0].y}`;
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x} ${p2.y}`;
  }
  return d;
}

const BUDGET_COLORS = ['error', 'tertiary-fixed', 'outline', 'secondary-fixed', 'primary-fixed', 'secondary'];
const ACCOUNT_ICONS = ['payments', 'account_balance', 'contactless', 'savings', 'wallet', 'credit_card'];

function fmt(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

export const FinancePage: React.FC = () => {
  const finance = useLifeOSStore((state) => state.data.finance);
  const openExpenseModal = useLifeOSStore((state) => state.openExpenseModal);
  const exportJson = useLifeOSStore((state) => state.exportJson);
  const exportSingleJson = useLifeOSStore((s) => s.exportSingleJson);
  const deleteTransaction = useLifeOSStore((s) => s.deleteTransaction);
  const updateTransaction = useLifeOSStore((s) => s.updateTransaction);
  const getMonthIncome = useLifeOSStore((s) => s.getMonthIncome);
  const getMonthExpense = useLifeOSStore((s) => s.getMonthExpense);
  const getBudgetSpent = useLifeOSStore((s) => s.getBudgetSpent);
  const addBudget = useLifeOSStore((s) => s.addBudget);
  const updateBudget = useLifeOSStore((s) => s.updateBudget);
  const deleteBudget = useLifeOSStore((s) => s.deleteBudget);
  const setMonthlyBudget = useLifeOSStore((s) => s.setMonthlyBudget);
  const addAccount = useLifeOSStore((s) => s.addAccount);
  const updateAccount = useLifeOSStore((s) => s.updateAccount);
  const deleteAccount = useLifeOSStore((s) => s.deleteAccount);
  const transferAccount = useLifeOSStore((s) => s.transferAccount);
  const requestConfirm = useLifeOSStore((s) => s.requestConfirm);
  const targets = finance.targets || [];
  const addTarget = useLifeOSStore((s) => s.addTarget);
  const updateTarget = useLifeOSStore((s) => s.updateTarget);
  const deleteTarget = useLifeOSStore((s) => s.deleteTarget);
  const allocateToTarget = useLifeOSStore((s) => s.allocateToTarget);
  const toggleTargetBought = useLifeOSStore((s) => s.toggleTargetBought);

  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // ---- targets tab state
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [tgName, setTgName] = useState('');
  const [tgPrice, setTgPrice] = useState('');
  const [tgSaved, setTgSaved] = useState('');
  const [tgPriority, setTgPriority] = useState<'high' | 'med' | 'low'>('med');
  const [tgNote, setTgNote] = useState('');
  const [allocDrafts, setAllocDrafts] = useState<Record<string, string>>({});

  // === 30-day arc REAL: saldo kumulatif harian September dari transaksi JSON ===
  const arc = useMemo(() => {
    const DAYS = 30;
    const sept = finance.transactions.filter((t) => t.date.startsWith('2026-09'));
    const signed = (t: (typeof sept)[number]) => (t.type === 'income' ? t.amount : -t.amount);
    const opening = finance.liquidBalance - sept.reduce((a, t) => a + signed(t), 0);
    const daily: number[] = [];
    for (let d = 1; d <= DAYS; d++) {
      const iso = `2026-09-${String(d).padStart(2, '0')}`;
      daily.push(sept.filter((t) => t.date === iso).reduce((a, t) => a + signed(t), 0));
    }
    let run = opening;
    const cum = daily.map((v) => (run += v));
    const min = Math.min(...cum, opening);
    const max = Math.max(...cum, opening);
    const span = max - min || 1;
    const pts = cum.map((v, i) => ({
      x: Number(((i * 400) / (DAYS - 1)).toFixed(1)),
      y: Number((56 - ((v - min) / span) * 48).toFixed(1)),
    }));
    const line = smoothLine(pts);
    return { line, area: `${line} L400 64 L0 64 Z`, min, max, opening, lastY: pts[pts.length - 1].y };
  }, [finance.transactions, finance.liquidBalance]);

  const totalTargetPrice = targets.reduce((a, t) => a + t.targetPrice, 0);
  const totalTargetSaved = targets.filter((t) => !t.bought).reduce((a, t) => a + Math.min(t.saved, t.targetPrice), 0);

  // ---- transactions tab state
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editType, setEditType] = useState<'expense' | 'income'>('expense');

  // ---- budget tab state
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [bName, setBName] = useState('');
  const [bCategory, setBCategory] = useState('Food');
  const [bCap, setBCap] = useState('');
  const [capDraft, setCapDraft] = useState<string | null>(null);

  // ---- accounts tab state
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [aName, setAName] = useState('');
  const [aDetail, setADetail] = useState('');
  const [aBalance, setABalance] = useState('');
  const [aIcon, setAIcon] = useState('account_balance_wallet');
  const [tFrom, setTFrom] = useState('');
  const [tTo, setTTo] = useState('');
  const [tAmount, setTAmount] = useState('');

  const budgets = finance.budgets || [];
  const accounts = finance.accounts || [];

  const monthIncome = getMonthIncome();
  const monthExpense = getMonthExpense();
  const savings = monthIncome - monthExpense;
  const burnPct = finance.monthlyBudget > 0 ? Math.round((monthExpense / finance.monthlyBudget) * 100) : 0;
  const savingsRate = monthIncome > 0 ? Math.round((savings / monthIncome) * 100) : 0;
  const budgetCapTotal = budgets.reduce((a, b) => a + b.cap, 0);
  const accountsTotal = accounts.reduce((a, x) => a + x.balance, 0);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(finance.transactions.map((t) => t.category)))],
    [finance.transactions]
  );

  const filteredTx = useMemo(() => {
    let list = [...finance.transactions];
    if (filterType !== 'all') list = list.filter((t) => t.type === filterType);
    if (categoryFilter !== 'All') list = list.filter((t) => t.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || (t.notes || '').toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case 'oldest': list.sort((a, b) => a.date.localeCompare(b.date)); break;
      case 'highest': list.sort((a, b) => b.amount - a.amount); break;
      case 'lowest': list.sort((a, b) => a.amount - b.amount); break;
      default: list.sort((a, b) => b.date.localeCompare(a.date));
    }
    return list;
  }, [finance.transactions, filterType, categoryFilter, search, sortBy]);

  const filteredExpenseTotal = filteredTx.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const filteredIncomeTotal = filteredTx.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);

  const openEditTx = (t: Transaction) => {
    setEditingTx(t);
    setEditTitle(t.title);
    setEditAmount(String(t.amount));
    setEditCategory(t.category);
    setEditType(t.type);
  };

  const saveEditTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    updateTransaction(editingTx.id, {
      title: editTitle.trim(),
      amount: Number(editAmount) || editingTx.amount,
      category: editCategory.trim() || editingTx.category,
      type: editType,
    });
    setEditingTx(null);
  };

  const openBudgetModal = (id?: string) => {
    if (id) {
      const b = budgets.find((x) => x.id === id);
      if (!b) return;
      setEditingBudgetId(id);
      setBName(b.name);
      setBCategory(b.category);
      setBCap(String(b.cap));
    } else {
      setEditingBudgetId(null);
      setBName('');
      setBCategory('Food');
      setBCap('');
    }
    setShowBudgetModal(true);
  };

  const saveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBudgetId) {
      updateBudget(editingBudgetId, { name: bName.trim(), category: bCategory.trim() || 'General', cap: Number(bCap) || 0 });
    } else {
      const r = addBudget({ name: bName, category: bCategory, cap: Number(bCap), color: BUDGET_COLORS[budgets.length % BUDGET_COLORS.length] });
      if (!r) return;
    }
    setShowBudgetModal(false);
  };

  const openAccountModal = (id?: string) => {
    if (id) {
      const a = accounts.find((x) => x.id === id);
      if (!a) return;
      setEditingAccountId(id);
      setAName(a.name);
      setADetail(a.detail);
      setABalance(String(a.balance));
      setAIcon(a.icon);
    } else {
      setEditingAccountId(null);
      setAName('');
      setADetail('');
      setABalance('');
      setAIcon('account_balance_wallet');
    }
    setShowAccountModal(true);
  };

  const saveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccountId) {
      updateAccount(editingAccountId, { name: aName.trim(), detail: aDetail.trim(), balance: Number(aBalance) || 0, icon: aIcon });
    } else {
      const r = addAccount({ name: aName, detail: aDetail, balance: Number(aBalance) || 0, icon: aIcon });
      if (!r) return;
    }
    setShowAccountModal(false);
  };

  const doTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferAccount(tFrom, tTo, Number(tAmount))) {
      setTAmount('');
    }
  };

  const openTargetModal = (id?: string) => {
    if (id) {
      const t = targets.find((x) => x.id === id);
      if (!t) return;
      setEditingTargetId(id);
      setTgName(t.name);
      setTgPrice(String(t.targetPrice));
      setTgSaved(String(t.saved));
      setTgPriority(t.priority);
      setTgNote(t.note || '');
    } else {
      setEditingTargetId(null);
      setTgName('');
      setTgPrice('');
      setTgSaved('');
      setTgPriority('med');
      setTgNote('');
    }
    setShowTargetModal(true);
  };

  const saveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTargetId) {
      updateTarget(editingTargetId, {
        name: tgName.trim(),
        targetPrice: Number(tgPrice) || 0,
        saved: Number(tgSaved) || 0,
        priority: tgPriority,
        note: tgNote.trim(),
      });
    } else {
      const r = addTarget({
        name: tgName,
        targetPrice: Number(tgPrice),
        saved: Number(tgSaved) || 0,
        priority: tgPriority,
        note: tgNote,
      });
      if (!r) return;
    }
    setShowTargetModal(false);
  };

  const tabBtn = (tab: Tab, icon: string, label: string, count?: number) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      role="tab"
      aria-selected={activeTab === tab}
      className={`flex items-center gap-space-xs h-9 px-space-md rounded-lg text-body-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
        activeTab === tab ? 'bg-surface-container-high text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
      }`}
      type="button"
    >
      <span className="material-symbols-outlined text-[15px]">{icon}</span>
      <span>{label}</span>
      {count !== undefined && (
        <span className="font-label-sm text-label-sm px-1 rounded bg-surface-container-high text-on-surface-variant font-mono">{count}</span>
      )}
    </button>
  );

  return (
    <div className="flex flex-col gap-space-lg w-full animate-fade-in">
      {/* Context Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-sm">
        <div className="flex items-center gap-space-md font-mono min-w-0">
          <div className="flex items-center gap-space-xs">
            <span className="w-2 h-2 rounded-full bg-tertiary-fixed shadow-sm shrink-0"></span>
            <span className="text-outline uppercase tracking-widest text-label-default">Financial Ledger</span>
          </div>
          <span className="text-outline-variant">/</span>
          <span className="text-on-surface-variant font-medium text-label-default truncate">September 2026</span>
        </div>

        <div className="flex items-center gap-space-xs self-start md:self-auto font-mono">
          <button
            onClick={exportJson}
            className="flex items-center gap-1.5 h-10 px-space-md rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors text-body-sm font-medium cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">download</span>
            <span className="hidden sm:inline">Export</span>
            <kbd className="font-kbd text-kbd px-1 py-0.2 rounded bg-surface-container-lowest text-on-surface-variant ml-1 font-mono hidden sm:inline">⌥E</kbd>
          </button>
          <button
            onClick={openExpenseModal}
            className="flex items-center gap-1.5 h-10 px-space-md rounded-lg bg-primary text-on-primary hover:bg-primary-fixed transition-colors text-body-sm font-medium shadow-sm font-sans cursor-pointer active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Add Transaction</span>
            <kbd className="font-kbd text-kbd px-1 py-0.2 rounded bg-surface-container text-on-surface ml-1 font-mono hidden sm:inline">N</kbd>
          </button>
        </div>
      </div>

      {/* Segmented Controller — scrollable on mobile */}
      <div className="flex items-center justify-between bg-surface-container-lowest p-space-2xs rounded-xl border border-outline-variant/20 gap-2">
        <div className="flex items-center gap-space-2xs overflow-x-auto flex-1 py-0.5" role="tablist" aria-label="Finance views">
          {tabBtn('overview', 'space_dashboard', 'Overview')}
          {tabBtn('transactions', 'receipt_long', 'Transactions', finance.transactions.length)}
          {tabBtn('budget', 'pie_chart', 'Budget', budgets.length)}
          {tabBtn('accounts', 'account_balance_wallet', 'Accounts', accounts.length)}
          {tabBtn('targets', 'shopping_bag', 'Targets', targets.filter((t) => !t.bought).length)}
        </div>
        <div className="hidden sm:flex items-center gap-space-sm pr-space-sm font-mono text-label-sm shrink-0">
          <span className="text-outline">AUTO-SYNC ON</span>
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed"></span>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Balance + cashflow (computed from JSON, not hardcoded) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
            <div className="lg:col-span-7 bg-surface-container-low rounded-xl p-space-md sm:p-space-xl flex flex-col justify-between relative overflow-hidden shadow-sm border border-outline-variant/20">
              <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-tertiary-fixed/5 pointer-events-none blur-3xl"></div>
              <div className="flex flex-col gap-space-xs relative z-10 font-mono">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-on-surface-variant uppercase tracking-wider text-label-default font-sans">Total Net Worth / Liquidity</span>
                  <span className="flex items-center gap-1 text-label-sm px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface-variant shrink-0">
                    <span className="material-symbols-outlined text-[13px]">lock</span> Secured
                  </span>
                </div>
                <div className="flex items-baseline gap-space-xs pt-space-xs flex-wrap">
                  <span className="font-headline-lg text-headline-lg text-outline">Rp</span>
                  <span className="font-display text-display text-primary tracking-tight font-semibold break-all">
                    {finance.liquidBalance.toLocaleString('id-ID')}
                  </span>
                  <span className="text-label-sm text-outline ml-space-xs">IDR</span>
                </div>
              </div>

              <div className="pt-space-xl pb-space-sm relative z-10 flex flex-col gap-space-xs">
              <div className="flex items-center justify-between text-outline font-mono text-label-sm gap-2">
                <span className="uppercase tracking-wider">30-Day Velocity Arc (real)</span>
                <span className={`font-medium ${savings >= 0 ? 'text-tertiary-fixed' : 'text-error'}`}>
                  {savings >= 0 ? '+' : ''}{savingsRate}% trajectory
                </span>
              </div>
              <div className="w-full h-16 relative" title={`Range Rp ${arc.min.toLocaleString('id-ID')} – Rp ${arc.max.toLocaleString('id-ID')}`}>
                <svg className="w-full h-full overflow-visible" fill="none" preserveAspectRatio="none" viewBox="0 0 400 64">
                  <defs>
                    <linearGradient id="balanceGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#6ffbbe" stopOpacity="0.3"></stop>
                      <stop offset="100%" stopColor="#6ffbbe" stopOpacity="0.0"></stop>
                    </linearGradient>
                  </defs>
                  <path d={arc.area} fill="url(#balanceGrad)"></path>
                  <path d={arc.line} fill="none" stroke="#6ffbbe" strokeLinecap="round" strokeWidth="2"></path>
                  <circle cx="398" cy={arc.lastY} fill="#6ffbbe" r="4"></circle>
                </svg>
              </div>
              <div className="flex justify-between text-label-sm text-outline pt-space-2xs font-mono text-[11px] gap-2 overflow-x-auto">
                <span className="whitespace-nowrap">01 Sep</span>
                <span className="whitespace-nowrap hidden sm:inline">Min Rp {arc.min.toLocaleString('id-ID')}</span>
                <span className="whitespace-nowrap hidden sm:inline">Max Rp {arc.max.toLocaleString('id-ID')}</span>
                <span className="whitespace-nowrap">Today (26 Sep)</span>
              </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-space-sm justify-between">
              <div className="bg-surface-container-low rounded-xl p-space-md flex items-center justify-between shadow-sm border border-outline-variant/20 gap-2">
                <div className="flex items-center gap-space-md min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-surface-container-high flex items-center justify-center text-tertiary-fixed">
                    <span className="material-symbols-outlined text-[20px]">arrow_downward_alt</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-label-default text-on-surface-variant font-sans">Income (Sep 2026)</span>
                    <span className="font-headline-sm text-headline-sm text-tertiary-fixed font-semibold tracking-tight font-mono truncate">+ {fmt(monthIncome)}</span>
                  </div>
                </div>
                <div className="text-label-sm px-space-xs py-0.5 rounded bg-surface-container text-tertiary-fixed font-mono shrink-0">{finance.monthlyBudget > 0 ? Math.round((monthIncome / finance.monthlyBudget) * 100) : 0}% Target</div>
              </div>

              <div className="bg-surface-container-low rounded-xl p-space-md flex items-center justify-between shadow-sm border border-outline-variant/20 gap-2">
                <div className="flex items-center gap-space-md min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-surface-container-high flex items-center justify-center text-error">
                    <span className="material-symbols-outlined text-[20px]">arrow_upward_alt</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-label-default text-on-surface-variant font-sans">Expense (Sep 2026)</span>
                    <span className="font-headline-sm text-headline-sm text-error font-semibold tracking-tight font-mono truncate">- {fmt(monthExpense)}</span>
                  </div>
                </div>
                <div className="text-label-sm px-space-xs py-0.5 rounded bg-surface-container text-error font-mono shrink-0">{burnPct}% Burn</div>
              </div>

              <div className="bg-surface-container-low rounded-xl p-space-md flex items-center justify-between shadow-sm border border-outline-variant/20 gap-2">
                <div className="flex items-center gap-space-md min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-surface-container-high flex items-center justify-center text-primary-fixed">
                    <span className="material-symbols-outlined text-[20px]">savings</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-label-default text-on-surface-variant font-sans">Net Savings Residual</span>
                    <span className={`font-headline-sm text-headline-sm font-semibold tracking-tight font-mono truncate ${savings >= 0 ? 'text-primary' : 'text-error'}`}>
                      {savings >= 0 ? '+' : '-'} {fmt(Math.abs(savings))}
                    </span>
                  </div>
                </div>
                <span className="text-label-sm px-space-xs py-1 rounded-md bg-secondary-container/40 text-secondary font-medium font-mono shrink-0">{savingsRate >= 0 ? '+' : ''}{savingsRate}% rate</span>
              </div>
            </div>
          </div>

          {/* Budgets preview + accounts preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
            <div className="lg:col-span-7 bg-surface-container-low rounded-xl p-space-md sm:p-space-lg flex flex-col gap-space-md shadow-sm border border-outline-variant/20">
              <div className="flex items-center justify-between pb-space-xs gap-2">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-outline text-[18px]">pie_chart</span>
                  <span className="font-headline-sm text-headline-sm text-primary font-semibold">Budget Depletion</span>
                </div>
                <button onClick={() => setActiveTab('budget')} className="font-label-sm text-label-sm text-tertiary-fixed hover:underline shrink-0">
                  Manage →
                </button>
              </div>
              <div className="flex flex-col gap-space-md font-mono">
                {budgets.slice(0, 4).map((b) => {
                  const spent = getBudgetSpent(b.category);
                  const pct = b.cap > 0 ? Math.min(100, Math.round((spent / b.cap) * 100)) : 0;
                  const over = spent > b.cap;
                  return (
                    <div key={b.id} className="flex flex-col gap-space-2xs">
                      <div className="flex justify-between items-baseline text-body-sm font-sans gap-2">
                        <div className="flex items-center gap-space-xs min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${over ? 'bg-error' : b.color === 'error' ? 'bg-error' : b.color === 'tertiary-fixed' ? 'bg-tertiary-fixed' : b.color === 'secondary-fixed' ? 'bg-secondary-fixed' : b.color === 'primary-fixed' ? 'bg-primary-fixed' : 'bg-outline'}`}></span>
                          <span className="text-on-surface font-medium truncate">{b.name}</span>
                        </div>
                        <div className="flex items-center gap-space-xs text-label-default font-mono shrink-0 text-[12px]">
                          <span className="text-primary">{fmt(spent)}</span>
                          <span className="text-outline">/</span>
                          <span className="text-outline">{fmt(b.cap)}</span>
                          <span className={`${over ? 'text-error' : 'text-tertiary-fixed'} font-medium pl-space-xs`}>{pct}%</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${over ? 'bg-error' : b.color === 'error' ? 'bg-error' : b.color === 'tertiary-fixed' ? 'bg-tertiary-fixed' : b.color === 'secondary-fixed' ? 'bg-secondary-fixed' : b.color === 'primary-fixed' ? 'bg-primary-fixed' : 'bg-outline'}`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
                {budgets.length === 0 && <p className="text-outline text-[13px]">Belum ada budget.</p>}
              </div>
              <div className="flex items-center justify-between pt-1 font-mono text-[12px]">
                <span className="text-outline">Total cap: {fmt(budgetCapTotal)}</span>
                <span className="text-outline">Monthly cap: {fmt(finance.monthlyBudget)}</span>
              </div>
            </div>

            <div className="lg:col-span-5 bg-surface-container-low rounded-xl p-space-md sm:p-space-lg flex flex-col justify-between shadow-sm border border-outline-variant/20">
              <div className="flex flex-col gap-space-md">
                <div className="flex items-center justify-between pb-space-xs gap-2">
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-outline text-[18px]">account_balance</span>
                    <span className="font-headline-sm text-headline-sm text-primary font-semibold">Liquidity Pool</span>
                  </div>
                  <button onClick={() => setActiveTab('accounts')} className="font-label-sm text-label-sm text-tertiary-fixed hover:underline shrink-0">
                    {accounts.length} Active →
                  </button>
                </div>
                <div className="flex flex-col gap-space-xs font-mono">
                  {accounts.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors gap-2">
                      <div className="flex items-center gap-space-sm min-w-0">
                        <div className="w-8 h-8 shrink-0 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface">
                          <span className="material-symbols-outlined text-[16px]">{a.icon}</span>
                        </div>
                        <div className="flex flex-col font-sans min-w-0">
                          <span className="text-body-default text-on-surface font-medium leading-none truncate">{a.name}</span>
                          <span className="text-label-sm text-outline mt-1 leading-none font-mono truncate">{a.detail}</span>
                        </div>
                      </div>
                      <span className="font-label-default text-primary font-semibold shrink-0">{fmt(a.balance)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-space-md mt-space-sm flex items-center justify-between bg-surface-container-lowest px-space-md py-space-sm rounded-lg font-mono gap-2">
                <span className="text-outline text-label-default">Sum Aggregate</span>
                <span className="text-primary font-bold text-label-default">{fmt(accountsTotal)}</span>
              </div>
            </div>
          </div>

          {/* Recent 5 */}
          <div className="bg-surface-container-low rounded-xl p-space-md sm:p-space-lg flex flex-col gap-space-md shadow-sm border border-outline-variant/20">
            <div className="flex items-center justify-between gap-2">
              <span className="font-headline-sm text-headline-sm text-primary font-semibold">Recent Transactions</span>
              <button onClick={() => setActiveTab('transactions')} className="font-label-sm text-label-sm text-tertiary-fixed hover:underline shrink-0">View all →</button>
            </div>
            <TxList
              items={[...finance.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)}
              onDelete={(id) => {
                const t = finance.transactions.find((x) => x.id === id);
                requestConfirm({
                  title: 'Hapus transaksi?',
                  message: `"${t?.title || ''}" akan dihapus dan saldo dikembalikan.`,
                  onConfirm: () => deleteTransaction(id),
                });
              }}
              onEdit={openEditTx}
            />
          </div>
        </>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-surface-container-low rounded-xl p-space-md sm:p-space-lg flex flex-col gap-space-md shadow-sm border border-outline-variant/20">
          <div className="flex flex-col lg:flex-row lg:items-center gap-space-sm">
            <div className="relative flex-1 min-w-0">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-outline">search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari judul, kategori, catatan..."
                className="w-full h-10 pl-9 pr-3 bg-surface-container-lowest text-on-surface placeholder:text-outline text-[13px] rounded-lg focus:outline-none focus:ring-1 focus:ring-tertiary-fixed"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {(['all', 'expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`h-10 px-3 rounded-lg text-[13px] font-medium capitalize min-w-[72px] ${filterType === t ? 'bg-surface-container-high text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
                >
                  {t === 'all' ? 'All' : t}
                </button>
              ))}
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-10 px-2 bg-surface-container rounded-lg text-on-surface-variant text-[12px] font-mono outline-none cursor-pointer" aria-label="Filter category">
                {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="h-10 px-2 bg-surface-container rounded-lg text-on-surface-variant text-[12px] font-mono outline-none cursor-pointer" aria-label="Sort">
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="highest">Highest Rp</option>
                <option value="lowest">Lowest Rp</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-[12px]">
            <span className="px-2.5 py-1 rounded-lg bg-surface-container text-error">Out: -{fmt(filteredExpenseTotal)}</span>
            <span className="px-2.5 py-1 rounded-lg bg-surface-container text-tertiary-fixed">In: +{fmt(filteredIncomeTotal)}</span>
            <span className="px-2.5 py-1 rounded-lg bg-surface-container-high text-primary">{filteredTx.length} rows</span>
            <button onClick={() => exportSingleJson('finance')} className="ml-auto h-9 px-3 rounded-lg bg-surface-container text-on-surface-variant hover:text-primary text-[12px] font-mono flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">download</span> finance.json
            </button>
          </div>

          {filteredTx.length === 0 ? (
            <div className="py-10 text-center text-outline text-[13px]">Tidak ada transaksi untuk filter ini.</div>
          ) : (
            <TxList
              items={filteredTx}
              onDelete={(id) => {
                const t = finance.transactions.find((x) => x.id === id);
                requestConfirm({
                  title: 'Hapus transaksi?',
                  message: `"${t?.title || ''}" akan dihapus dan saldo dikembalikan.`,
                  onConfirm: () => deleteTransaction(id),
                });
              }}
              onEdit={openEditTx}
            />
          )}
        </div>
      )}

      {activeTab === 'budget' && (
        <div className="flex flex-col gap-space-md">
          <div className="bg-surface-container-low rounded-xl p-space-md sm:p-space-lg border border-outline-variant/20 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-headline-sm text-primary font-semibold">Monthly Budget Cap</p>
              <p className="font-body-sm text-outline text-[12px]">Batas total pengeluaran bulan September 2026. Saat ini terpakai {fmt(monthExpense)} ({burnPct}%).</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 bg-surface-container-lowest rounded-lg px-2 h-11">
                <span className="font-mono text-outline text-[12px]">Rp</span>
                <input
                  type="number"
                  min={1}
                  value={capDraft ?? finance.monthlyBudget}
                  onChange={(e) => setCapDraft(e.target.value)}
                  className="w-36 bg-transparent text-primary font-mono text-[14px] outline-none"
                  aria-label="Monthly budget cap"
                />
              </div>
              <button
                onClick={() => { setMonthlyBudget(Number(capDraft ?? finance.monthlyBudget)); setCapDraft(null); }}
                className="h-11 px-4 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed text-[13px] font-semibold hover:bg-tertiary-fixed-dim active:scale-95"
              >
                Save Cap
              </button>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl p-space-md sm:p-space-lg flex flex-col gap-space-md shadow-sm border border-outline-variant/20">
            <div className="flex items-center justify-between gap-2">
              <span className="font-headline-sm text-headline-sm text-primary font-semibold">Category Budgets ({budgets.length})</span>
              <button onClick={() => openBudgetModal()} className="h-10 px-3 rounded-lg bg-primary text-on-primary text-[13px] font-medium flex items-center gap-1.5 hover:bg-primary-fixed active:scale-95">
                <span className="material-symbols-outlined text-[16px]">add</span> New Budget
              </button>
            </div>
            {budgets.length === 0 && <p className="text-outline text-[13px] py-4 text-center">Belum ada budget. Buat yang pertama.</p>}
            <div className="flex flex-col gap-space-md font-mono">
              {budgets.map((b) => {
                const spent = getBudgetSpent(b.category);
                const pct = b.cap > 0 ? Math.round((spent / b.cap) * 100) : 0;
                const over = spent > b.cap;
                const barPct = Math.min(100, pct);
                return (
                  <div key={b.id} className="flex flex-col gap-2 p-3 rounded-xl bg-surface-container-lowest/60 border border-outline-variant/20">
                    <div className="flex justify-between items-center text-body-sm font-sans gap-2">
                      <div className="flex items-center gap-space-xs min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${over ? 'bg-error' : b.color === 'error' ? 'bg-error' : b.color === 'tertiary-fixed' ? 'bg-tertiary-fixed' : b.color === 'secondary-fixed' ? 'bg-secondary-fixed' : b.color === 'primary-fixed' ? 'bg-primary-fixed' : 'bg-outline'}`}></span>
                        <span className="text-on-surface font-medium truncate">{b.name}</span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-mono shrink-0">{b.category}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => openBudgetModal(b.id)} aria-label={`Edit ${b.name}`} className="w-9 h-9 rounded-lg flex items-center justify-center text-outline hover:text-primary hover:bg-surface-container-high">
                          <span className="material-symbols-outlined text-[17px]">edit</span>
                        </button>
                        <button onClick={() => requestConfirm({ title: 'Hapus budget?', message: `Budget "${b.name}" akan dihapus. Transaksi terkait tetap tersimpan.`, onConfirm: () => deleteBudget(b.id) })} aria-label={`Delete ${b.name}`} className="w-9 h-9 rounded-lg flex items-center justify-center text-outline hover:text-error hover:bg-error/10">
                          <span className="material-symbols-outlined text-[17px]">delete</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-xs text-label-default font-mono text-[12px] justify-between">
                      <span className="text-primary">{fmt(spent)}</span>
                      <span className="text-outline">/ {fmt(b.cap)}</span>
                      <span className={`${over ? 'text-error' : pct >= 80 ? 'text-error' : 'text-tertiary-fixed'} font-medium`}>{over ? `OVER ${fmt(spent - b.cap)}` : `${pct}%`}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${over ? 'bg-error' : pct >= 80 ? 'bg-error/80' : 'bg-tertiary-fixed'}`} style={{ width: `${barPct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'accounts' && (
        <div className="flex flex-col gap-space-md">
          <div className="bg-surface-container-low rounded-xl p-space-md sm:p-space-lg border border-outline-variant/20 shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-headline-sm text-primary font-semibold">Accounts ({accounts.length})</p>
                <p className="font-mono text-[12px] text-outline">Total: <span className="text-primary font-bold">{fmt(accountsTotal)}</span></p>
              </div>
              <button onClick={() => openAccountModal()} className="h-10 px-3 rounded-lg bg-primary text-on-primary text-[13px] font-medium flex items-center gap-1.5 hover:bg-primary-fixed active:scale-95 shrink-0">
                <span className="material-symbols-outlined text-[16px]">add</span> New Account
              </button>
            </div>
            {accounts.length === 0 && <p className="text-outline text-[13px] py-4 text-center">Belum ada account.</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
              {accounts.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-space-sm rounded-xl bg-surface-container border border-outline-variant/20 gap-2">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded-lg bg-surface-container-highest flex items-center justify-center text-tertiary-fixed">
                      <span className="material-symbols-outlined text-[18px]">{a.icon}</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-body-default text-on-surface font-medium leading-tight truncate">{a.name}</span>
                      <span className="text-label-sm text-outline font-mono truncate">{a.detail}</span>
                      <span className="text-label-default text-primary font-semibold font-mono">{fmt(a.balance)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openAccountModal(a.id)} aria-label={`Edit ${a.name}`} className="w-9 h-9 rounded-lg flex items-center justify-center text-outline hover:text-primary hover:bg-surface-container-high">
                      <span className="material-symbols-outlined text-[17px]">edit</span>
                    </button>
                    <button onClick={() => requestConfirm({ title: 'Hapus account?', message: `"${a.name}" (${fmt(a.balance)}) akan dihapus permanen.`, onConfirm: () => deleteAccount(a.id) })} aria-label={`Delete ${a.name}`} className="w-9 h-9 rounded-lg flex items-center justify-center text-outline hover:text-error hover:bg-error/10">
                      <span className="material-symbols-outlined text-[17px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl p-space-md sm:p-space-lg border border-outline-variant/20 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-outline text-[18px]">sync_alt</span>
              <span className="font-headline-sm text-headline-sm text-primary font-semibold">Transfer Between Accounts</span>
            </div>
            {accounts.length < 2 ? (
              <p className="text-outline text-[13px]">Butuh minimal 2 account untuk transfer.</p>
            ) : (
              <form onSubmit={doTransfer} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <select value={tFrom} onChange={(e) => setTFrom(e.target.value)} required className="h-11 px-3 bg-surface-container-lowest rounded-lg text-primary text-[13px] outline-none" aria-label="From account">
                  <option value="">From…</option>
                  {accounts.map((a) => (<option key={a.id} value={a.id}>{a.name} ({fmt(a.balance)})</option>))}
                </select>
                <select value={tTo} onChange={(e) => setTTo(e.target.value)} required className="h-11 px-3 bg-surface-container-lowest rounded-lg text-primary text-[13px] outline-none" aria-label="To account">
                  <option value="">To…</option>
                  {accounts.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
                </select>
                <input type="number" min={1} required value={tAmount} onChange={(e) => setTAmount(e.target.value)} placeholder="Amount IDR" className="h-11 px-3 bg-surface-container-lowest rounded-lg text-primary font-mono text-[13px] outline-none" aria-label="Transfer amount" />
                <button type="submit" className="h-11 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed text-[13px] font-semibold hover:bg-tertiary-fixed-dim active:scale-95 flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">sync_alt</span> Transfer
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {activeTab === 'targets' && (
        <div className="flex flex-col gap-space-md">
          <div className="bg-surface-container-low rounded-xl p-space-md sm:p-space-lg border border-outline-variant/20 shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-headline-sm text-primary font-semibold">Target Pembelian ({targets.filter((t) => !t.bought).length} aktif)</p>
                <p className="font-mono text-[12px] text-outline">
                  Terkumpul <span className="text-tertiary-fixed font-bold">{fmt(totalTargetSaved)}</span>
                  {' / '}{fmt(totalTargetPrice)}
                </p>
              </div>
              <button onClick={() => openTargetModal()} className="h-10 px-3 rounded-lg bg-primary text-on-primary text-[13px] font-medium flex items-center gap-1.5 hover:bg-primary-fixed active:scale-95 shrink-0">
                <span className="material-symbols-outlined text-[16px]">add</span> New Target
              </button>
            </div>
            {targets.length === 0 && <p className="text-outline text-[13px] py-4 text-center">Belum ada target. Buat target pembelian pertamamu.</p>}
            <div className="flex flex-col gap-space-sm">
              {targets.map((t) => {
                const pct = t.targetPrice > 0 ? Math.min(100, Math.round((Math.min(t.saved, t.targetPrice) / t.targetPrice) * 100)) : 0;
                const done = t.bought || t.saved >= t.targetPrice;
                return (
                  <div key={t.id} className={`p-space-md rounded-xl border flex flex-col gap-2 ${done ? 'bg-surface-container-lowest/60 border-tertiary-fixed/30 opacity-80' : 'bg-surface-container border-outline-variant/20'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`font-body-default font-semibold truncate ${done ? 'line-through text-outline' : 'text-primary'}`}>
                          {t.name}
                        </p>
                        {t.note && <p className="text-[12px] text-outline truncate">{t.note}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${t.priority === 'high' ? 'bg-error/15 text-error' : t.priority === 'med' ? 'bg-secondary-container/40 text-secondary-fixed' : 'bg-surface-container-high text-outline'}`}>
                          {t.priority.toUpperCase()}
                        </span>
                        <button onClick={() => openTargetModal(t.id)} aria-label={`Edit ${t.name}`} className="w-9 h-9 rounded-lg flex items-center justify-center text-outline hover:text-primary hover:bg-surface-container-high">
                          <span className="material-symbols-outlined text-[17px]">edit</span>
                        </button>
                        <button onClick={() => requestConfirm({ title: 'Hapus target?', message: `Target "${t.name}" (${fmt(t.targetPrice)}) akan dihapus. Saldo yang sudah dialokasikan tidak dikembalikan otomatis.`, onConfirm: () => deleteTarget(t.id) })} aria-label={`Delete ${t.name}`} className="w-9 h-9 rounded-lg flex items-center justify-center text-outline hover:text-error hover:bg-error/10">
                          <span className="material-symbols-outlined text-[17px]">delete</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-xs font-mono text-[12px]">
                      <span className="text-tertiary-fixed font-bold">{fmt(Math.min(t.saved, t.targetPrice))}</span>
                      <span className="text-outline">/ {fmt(t.targetPrice)}</span>
                      <span className={`ml-auto font-bold ${done ? 'text-tertiary-fixed' : 'text-primary'}`}>{done ? 'FUNDED ✓' : `${pct}%`}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-tertiary-fixed' : 'bg-primary-fixed'}`} style={{ width: `${pct}%` }}></div>
                    </div>
                    {!done && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const v = allocDrafts[t.id];
                          if (!v) return;
                          allocateToTarget(t.id, Number(v));
                          setAllocDrafts((d) => ({ ...d, [t.id]: '' }));
                        }}
                        className="flex flex-col sm:flex-row sm:items-center gap-2"
                      >
                        <input
                          type="number"
                          min={1}
                          value={allocDrafts[t.id] || ''}
                          onChange={(e) => setAllocDrafts((d) => ({ ...d, [t.id]: e.target.value }))}
                          placeholder="Alokasi Rp…"
                          className="flex-1 h-10 px-3 bg-surface-container-lowest rounded-lg text-primary font-mono text-[13px] outline-none focus:ring-1 focus:ring-tertiary-fixed min-w-0"
                          aria-label={`Alokasi ke ${t.name}`}
                        />
                        <div className="flex gap-2">
                          <button type="submit" className="flex-1 sm:flex-none h-10 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary text-[12px] font-medium">
                            Alokasi
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleTargetBought(t.id)}
                            className="flex-1 sm:flex-none h-10 px-3 rounded-lg bg-tertiary-fixed/15 text-tertiary-fixed hover:bg-tertiary-fixed hover:text-on-tertiary-fixed text-[12px] font-semibold transition-colors"
                          >
                            Bought ✓
                          </button>
                        </div>
                      </form>
                    )}
                    {done && !t.bought && (
                      <button onClick={() => toggleTargetBought(t.id)} className="self-start h-9 px-3 rounded-lg bg-tertiary-fixed/15 text-tertiary-fixed hover:bg-tertiary-fixed hover:text-on-tertiary-fixed text-[12px] font-semibold transition-colors">
                        Mark as Bought ✓
                      </button>
                    )}
                    {t.bought && (
                      <button onClick={() => toggleTargetBought(t.id)} className="self-start font-mono text-[11px] text-outline hover:text-primary">
                        ↩ Batalkan status bought
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Edit transaction modal */}
      <Modal open={!!editingTx} onClose={() => setEditingTx(null)} title="Edit Transaction">
        <form onSubmit={saveEditTx} className="flex flex-col gap-space-sm">
          <div className="flex gap-2 p-0.5 bg-surface-container-lowest rounded-lg">
            {(['expense', 'income'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setEditType(t)} className={`flex-1 h-10 rounded text-label-sm font-medium font-mono capitalize ${editType === t ? (t === 'expense' ? 'bg-error/20 text-error font-bold' : 'bg-tertiary-fixed/20 text-tertiary-fixed font-bold') : 'text-outline hover:text-primary'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] uppercase text-outline font-mono">Title *</label>
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required className="bg-surface-container-lowest px-3 py-2.5 rounded-lg text-primary outline-none focus:ring-1 focus:ring-tertiary-fixed min-h-[44px]" />
          </div>
          <div className="grid grid-cols-2 gap-space-sm">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-[11px] uppercase text-outline font-mono">Amount *</label>
              <input type="number" min={1} value={editAmount} onChange={(e) => setEditAmount(e.target.value)} required className="bg-surface-container-lowest px-3 py-2.5 rounded-lg text-primary font-mono outline-none min-h-[44px]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-[11px] uppercase text-outline font-mono">Category</label>
              <input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="bg-surface-container-lowest px-3 py-2.5 rounded-lg text-primary outline-none min-h-[44px]" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEditingTx(null)} className="h-11 px-4 text-on-surface-variant hover:text-primary">Cancel</button>
            <button type="submit" className="h-11 px-5 bg-tertiary-fixed text-on-tertiary-fixed rounded-lg font-semibold hover:bg-tertiary-fixed-dim active:scale-95">Save</button>
          </div>
        </form>
      </Modal>

      {/* Budget modal */}
      <Modal open={showBudgetModal} onClose={() => setShowBudgetModal(false)} title={editingBudgetId ? 'Edit Budget' : 'New Budget'}>
        <form onSubmit={saveBudget} className="flex flex-col gap-space-sm">
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] uppercase text-outline font-mono">Name *</label>
            <input autoFocus value={bName} onChange={(e) => setBName(e.target.value)} required placeholder="e.g. Food & Groceries" className="bg-surface-container-lowest px-3 py-2.5 rounded-lg text-primary outline-none focus:ring-1 focus:ring-tertiary-fixed min-h-[44px]" />
          </div>
          <div className="grid grid-cols-2 gap-space-sm">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-[11px] uppercase text-outline font-mono">Category</label>
              <select value={bCategory} onChange={(e) => setBCategory(e.target.value)} className="bg-surface-container-lowest px-3 py-2.5 rounded-lg text-primary outline-none min-h-[44px]">
                {categories.filter((c) => c !== 'All').map((c) => (<option key={c} value={c}>{c}</option>))}
                <option value="General">General</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-[11px] uppercase text-outline font-mono">Cap (IDR) *</label>
              <input type="number" min={1} required value={bCap} onChange={(e) => setBCap(e.target.value)} placeholder="800000" className="bg-surface-container-lowest px-3 py-2.5 rounded-lg text-primary font-mono outline-none min-h-[44px]" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowBudgetModal(false)} className="h-11 px-4 text-on-surface-variant hover:text-primary">Cancel</button>
            <button type="submit" className="h-11 px-5 bg-tertiary-fixed text-on-tertiary-fixed rounded-lg font-semibold hover:bg-tertiary-fixed-dim active:scale-95">Save</button>
          </div>
        </form>
      </Modal>

      {/* Target modal */}
      <Modal open={showTargetModal} onClose={() => setShowTargetModal(false)} title={editingTargetId ? 'Edit Target' : 'New Target Pembelian'}>
        <form onSubmit={saveTarget} className="flex flex-col gap-space-sm">
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] uppercase text-outline font-mono">Nama Barang *</label>
            <input autoFocus value={tgName} onChange={(e) => setTgName(e.target.value)} required placeholder="e.g. Laptop Kerja" className="bg-surface-container-lowest px-3 py-2.5 rounded-lg text-primary outline-none focus:ring-1 focus:ring-tertiary-fixed min-h-[44px]" />
          </div>
          <div className="grid grid-cols-2 gap-space-sm">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-[11px] uppercase text-outline font-mono">Target Harga (IDR) *</label>
              <input type="number" min={1} required value={tgPrice} onChange={(e) => setTgPrice(e.target.value)} placeholder="15000000" className="bg-surface-container-lowest px-3 py-2.5 rounded-lg text-primary font-mono outline-none min-h-[44px]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-[11px] uppercase text-outline font-mono">Sudah Terkumpul</label>
              <input type="number" min={0} value={tgSaved} onChange={(e) => setTgSaved(e.target.value)} placeholder="0" className="bg-surface-container-lowest px-3 py-2.5 rounded-lg text-primary font-mono outline-none min-h-[44px]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-space-sm">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-[11px] uppercase text-outline font-mono">Priority</label>
              <select value={tgPriority} onChange={(e) => setTgPriority(e.target.value as 'high' | 'med' | 'low')} className="bg-surface-container-lowest px-3 py-2.5 rounded-lg text-primary outline-none min-h-[44px]">
                <option value="high">High</option>
                <option value="med">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-[11px] uppercase text-outline font-mono">Catatan</label>
              <input value={tgNote} onChange={(e) => setTgNote(e.target.value)} placeholder="Target Q4…" className="bg-surface-container-lowest px-3 py-2.5 rounded-lg text-primary outline-none min-h-[44px]" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowTargetModal(false)} className="h-11 px-4 text-on-surface-variant hover:text-primary">Cancel</button>
            <button type="submit" className="h-11 px-5 bg-tertiary-fixed text-on-tertiary-fixed rounded-lg font-semibold hover:bg-tertiary-fixed-dim active:scale-95">Save</button>
          </div>
        </form>
      </Modal>

      {/* Account modal */}
      <Modal open={showAccountModal} onClose={() => setShowAccountModal(false)} title={editingAccountId ? 'Edit Account' : 'New Account'}>
        <form onSubmit={saveAccount} className="flex flex-col gap-space-sm">
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] uppercase text-outline font-mono">Name *</label>
            <input autoFocus value={aName} onChange={(e) => setAName(e.target.value)} required placeholder="e.g. Emergency Fund" className="bg-surface-container-lowest px-3 py-2.5 rounded-lg text-primary outline-none focus:ring-1 focus:ring-tertiary-fixed min-h-[44px]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] uppercase text-outline font-mono">Detail</label>
            <input value={aDetail} onChange={(e) => setADetail(e.target.value)} placeholder="e.g. Jenius / Vault" className="bg-surface-container-lowest px-3 py-2.5 rounded-lg text-primary outline-none min-h-[44px]" />
          </div>
          <div className="grid grid-cols-2 gap-space-sm">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-[11px] uppercase text-outline font-mono">Balance (IDR)</label>
              <input type="number" min={0} value={aBalance} onChange={(e) => setABalance(e.target.value)} placeholder="0" className="bg-surface-container-lowest px-3 py-2.5 rounded-lg text-primary font-mono outline-none min-h-[44px]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-[11px] uppercase text-outline font-mono">Icon</label>
              <select value={aIcon} onChange={(e) => setAIcon(e.target.value)} className="bg-surface-container-lowest px-3 py-2.5 rounded-lg text-primary outline-none min-h-[44px]">
                {ACCOUNT_ICONS.map((i) => (<option key={i} value={i}>{i}</option>))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowAccountModal(false)} className="h-11 px-4 text-on-surface-variant hover:text-primary">Cancel</button>
            <button type="submit" className="h-11 px-5 bg-tertiary-fixed text-on-tertiary-fixed rounded-lg font-semibold hover:bg-tertiary-fixed-dim active:scale-95">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const TxList: React.FC<{
  items: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (t: Transaction) => void;
}> = ({ items, onDelete, onEdit }) => (
  <div className="flex flex-col gap-space-2xs w-full font-mono">
    {items.map((t) => (
      <div key={t.id} className="flex items-center justify-between min-h-[52px] px-space-md py-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container transition-colors group gap-2">
        <div className="flex items-center gap-space-md min-w-0 font-sans flex-1">
          <span className="text-label-sm text-outline shrink-0 w-12 font-mono">{t.date.slice(8, 10)} Sep</span>
          <div className="flex items-center gap-space-xs min-w-0">
            <span className="text-body-default text-primary font-medium truncate">{t.title}</span>
            <span className="hidden md:inline text-label-sm px-1.5 py-0.2 rounded bg-surface-container-high text-on-surface-variant shrink-0 font-mono">{t.category}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0 font-mono">
          <span className="hidden sm:inline text-label-sm text-outline font-sans">{t.type === 'income' ? 'Bank Deposit' : 'Cash/Wallet'}</span>
          <span className={`text-label-default min-w-[100px] text-right ${t.type === 'income' ? 'text-tertiary-fixed font-bold' : 'text-error font-medium'}`}>
            {t.type === 'income' ? '+' : '-'} Rp {t.amount.toLocaleString('id-ID')}
          </span>
          <button onClick={() => onEdit(t)} aria-label={`Edit ${t.title}`} className="w-9 h-9 rounded-lg flex items-center justify-center text-outline sm:opacity-0 sm:group-hover:opacity-100 hover:text-primary hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-[17px]">edit</span>
          </button>
          <button onClick={() => onDelete(t.id)} aria-label={`Delete ${t.title}`} className="w-9 h-9 rounded-lg flex items-center justify-center text-outline sm:opacity-0 sm:group-hover:opacity-100 hover:text-error hover:bg-error/10">
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>
    ))}
  </div>
);
