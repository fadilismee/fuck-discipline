import React, { useState } from 'react';
import { useLifeOSStore } from '../../store/useLifeOSStore';
import { useWebAudio } from '../../hooks/useWebAudio';

export const QuickExpenseModal: React.FC = () => {
  const isExpenseModalOpen = useLifeOSStore((state) => state.isExpenseModalOpen);
  const closeExpenseModal = useLifeOSStore((state) => state.closeExpenseModal);
  const addTransaction = useLifeOSStore((state) => state.addTransaction);
  const { playBeep } = useWebAudio();

  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Food');
  const [type, setType] = useState<'expense' | 'income'>('expense');

  if (!isExpenseModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !title.trim()) return;

    addTransaction({
      amount: parseFloat(amount),
      title: title.trim(),
      category,
      type,
    });

    playBeep(type === 'income' ? 880 : 520, 'sine', 0.15);
    setAmount('');
    setTitle('');
    closeExpenseModal();
  };

  return (
    <div
      onClick={closeExpenseModal}
      className="fixed inset-0 bg-surface-container-lowest/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-container-low rounded-xl p-space-lg w-full max-w-sm border border-outline-variant/40 shadow-2xl flex flex-col gap-space-md"
      >
        <div className="flex items-center justify-between border-b border-surface-container-highest pb-space-xs">
          <span className="font-headline-sm text-headline-sm text-primary font-bold">
            Log Daily Entry
          </span>
          <button
            onClick={closeExpenseModal}
            className="text-outline hover:text-primary cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-space-sm">
          <div className="flex gap-2 p-0.5 bg-surface-container-lowest rounded-lg">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-1 rounded text-label-sm font-medium font-mono cursor-pointer ${
                type === 'expense'
                  ? 'bg-error/20 text-error font-bold'
                  : 'text-outline hover:text-primary'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-1 rounded text-label-sm font-medium font-mono cursor-pointer ${
                type === 'income'
                  ? 'bg-tertiary-fixed/20 text-tertiary-fixed font-bold'
                  : 'text-outline hover:text-primary'
              }`}
            >
              Income
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] uppercase text-outline font-mono">
              Amount (IDR) *
            </label>
            <input
              type="number"
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 25000"
              className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary font-mono text-headline-sm outline-none focus:ring-1 focus:ring-tertiary-fixed"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] uppercase text-outline">
              Description *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Warung Makan / Kopi"
              className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary text-body-default outline-none focus:ring-1 focus:ring-tertiary-fixed"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] uppercase text-outline">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary text-body-sm outline-none"
            >
              <option value="Food">Food & Meals</option>
              <option value="Coffee">Coffee & Beverage</option>
              <option value="Transport">Transport & Fuel</option>
              <option value="Utilities">Utilities & Internet</option>
              <option value="Education">Books & Learning</option>
              <option value="Income">Income / Freelance</option>
              <option value="General">General</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-space-xs">
            <button
              type="button"
              onClick={closeExpenseModal}
              className="px-space-md h-8 text-on-surface-variant hover:text-primary text-body-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-space-md h-8 bg-primary text-on-primary rounded-lg text-body-sm font-semibold hover:bg-primary-fixed cursor-pointer active:scale-95 transition-transform"
            >
              Confirm Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
