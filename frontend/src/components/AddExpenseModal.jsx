import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { addExpense } from '../api/expensesApi';
import { formatCurrency } from '../lib/utils';
import { Avatar } from './layout/AppLayout';

const CATEGORIES = ['general', 'food', 'transport', 'accommodation', 'entertainment', 'utilities', 'shopping', 'health'];
const SPLIT_TYPES = [
  { id: 'equal', label: 'Equal', desc: 'Split evenly' },
  { id: 'percentage', label: '%', desc: 'By percentage' },
  { id: 'exact', label: '$', desc: 'Exact amounts' },
];

export default function AddExpenseModal({ groupId, members, currentUserId, onClose, onAdded }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 fields
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(currentUserId || members[0]?._id || '');
  const [category, setCategory] = useState('general');

  // Step 2 fields
  const [splitType, setSplitType] = useState('equal');
  const [participants, setParticipants] = useState(members.map((m) => m._id));
  const [percentages, setPercentages] = useState({});
  const [exactAmounts, setExactAmounts] = useState({});

  const totalAmount = parseFloat(amount) || 0;

  // Auto-fill equal values when participants/amount/splitType changes
  useEffect(() => {
    if (splitType === 'percentage' && participants.length > 0) {
      const each = Math.floor((100 / participants.length) * 100) / 100;
      const map = {};
      participants.forEach((id, i) => {
        map[id] = i === 0 ? (100 - each * (participants.length - 1)).toFixed(2) : each.toFixed(2);
      });
      setPercentages(map);
    }
    if (splitType === 'exact' && totalAmount > 0 && participants.length > 0) {
      const each = Math.floor((totalAmount / participants.length) * 100) / 100;
      const map = {};
      participants.forEach((id, i) => {
        map[id] = i === 0
          ? (totalAmount - each * (participants.length - 1)).toFixed(2)
          : each.toFixed(2);
      });
      setExactAmounts(map);
    }
  }, [splitType, participants.length, totalAmount]);

  const toggleParticipant = (uid) => {
    setParticipants((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const percentageTotal = participants.reduce((s, id) => s + (parseFloat(percentages[id]) || 0), 0);
  const exactTotal = participants.reduce((s, id) => s + (parseFloat(exactAmounts[id]) || 0), 0);

  const getValidationError = () => {
    if (splitType === 'percentage') {
      if (Math.abs(percentageTotal - 100) > 0.1) return `Percentages sum to ${percentageTotal.toFixed(1)}% (need 100%)`;
    }
    if (splitType === 'exact') {
      if (Math.abs(exactTotal - totalAmount) > 0.01)
        return `Amounts sum to ${formatCurrency(exactTotal)} (need ${formatCurrency(totalAmount)})`;
    }
    return null;
  };

  const validationError = getValidationError();

  const handleSubmit = async () => {
    if (!description.trim() || !amount || participants.length === 0) {
      toast.error('Please fill all required fields.');
      return;
    }
    if (validationError) { toast.error(validationError); return; }

    setLoading(true);
    try {
      const payload = {
        description: description.trim(),
        amount: parseFloat(amount),
        paidBy,
        splitType,
        participants,
        category,
        ...(splitType === 'percentage' && { percentages: participants.map((id) => parseFloat(percentages[id] || 0)) }),
        ...(splitType === 'exact' && { exactAmounts: participants.map((id) => parseFloat(exactAmounts[id] || 0)) }),
      };
      const { data } = await addExpense(groupId, payload);
      onAdded(data);
      toast.success('Expense added!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add expense.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg bg-bg-elevated border border-border rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 sticky top-0 bg-bg-elevated border-b border-border z-10">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="text-base font-bold text-text-primary">Add expense</h2>
              <p className="text-xs text-text-muted">Step {step} of 2 — {step === 1 ? 'Details' : 'Split'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4 pb-0">
          <div className="flex gap-2">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-accent-green' : 'bg-bg-hover'}`}
              />
            ))}
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {step === 1 ? (
            <>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Description</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What was this for?"
                  autoFocus
                  className="w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted text-sm outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-bg-card border border-border rounded-lg pl-8 pr-4 py-3 text-text-primary placeholder-text-muted text-sm outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Paid by</label>
                <div className="grid grid-cols-2 gap-2">
                  {members.map((m) => (
                    <button
                      key={m._id}
                      type="button"
                      onClick={() => setPaidBy(m._id)}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-all ${
                        paidBy === m._id
                          ? 'border-accent-green/40 bg-accent-green/8 text-text-primary'
                          : 'border-border bg-bg-card text-text-secondary hover:border-border-hover'
                      }`}
                    >
                      <Avatar name={m.name} size="sm" />
                      <span className="truncate">{m._id === currentUserId ? 'You' : m.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                        category === c
                          ? 'bg-accent-purple/15 text-accent-purple border border-accent-purple/30'
                          : 'bg-bg-card border border-border text-text-muted hover:text-text-secondary hover:border-border-hover'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!description.trim() || !amount || parseFloat(amount) <= 0}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-green text-bg-base text-sm font-semibold hover:bg-accent-green-dim active:scale-[0.98] transition-all disabled:opacity-40"
              >
                Next: Split <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              {/* Split type */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Split type</label>
                <div className="grid grid-cols-3 gap-2">
                  {SPLIT_TYPES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSplitType(st.id)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        splitType === st.id
                          ? 'border-accent-green/40 bg-accent-green/8'
                          : 'border-border bg-bg-card hover:border-border-hover'
                      }`}
                    >
                      <p className={`font-bold text-base ${splitType === st.id ? 'text-accent-green' : 'text-text-primary'}`}>{st.label}</p>
                      <p className="text-xs text-text-muted mt-0.5">{st.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Participants */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Participants</label>
                <div className="space-y-2">
                  {members.map((m) => {
                    const isSelected = participants.includes(m._id);
                    return (
                      <div
                        key={m._id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          isSelected ? 'border-accent-green/30 bg-accent-green/5' : 'border-border bg-bg-card opacity-50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleParticipant(m._id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? 'bg-accent-green border-accent-green' : 'border-border-hover'
                          }`}
                        >
                          {isSelected && <span className="text-bg-base text-xs">✓</span>}
                        </button>

                        <Avatar name={m.name} size="sm" />
                        <span className="flex-1 text-sm text-text-primary">{m._id === currentUserId ? 'You' : m.name}</span>

                        {isSelected && splitType === 'equal' && totalAmount > 0 && (
                          <span className="text-xs font-medium text-text-secondary">
                            {formatCurrency(totalAmount / participants.length)}
                          </span>
                        )}

                        {isSelected && splitType === 'percentage' && (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={percentages[m._id] || ''}
                              onChange={(e) => setPercentages((p) => ({ ...p, [m._id]: e.target.value }))}
                              className="w-16 bg-bg-elevated border border-border rounded-lg px-2 py-1 text-xs text-text-primary text-right outline-none focus:border-accent-green/50 transition-all"
                            />
                            <span className="text-xs text-text-muted">%</span>
                          </div>
                        )}

                        {isSelected && splitType === 'exact' && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-text-muted">$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={exactAmounts[m._id] || ''}
                              onChange={(e) => setExactAmounts((p) => ({ ...p, [m._id]: e.target.value }))}
                              className="w-20 bg-bg-elevated border border-border rounded-lg px-2 py-1 text-xs text-text-primary text-right outline-none focus:border-accent-green/50 transition-all"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Validation feedback */}
              {(splitType === 'percentage' || splitType === 'exact') && (
                <div className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${
                  validationError ? 'bg-accent-red/8 text-accent-red border border-accent-red/20' : 'bg-accent-green/8 text-accent-green border border-accent-green/20'
                }`}>
                  {splitType === 'percentage' ? (
                    <>
                      <span>Total</span>
                      <span className="font-bold">{percentageTotal.toFixed(1)}% / 100%</span>
                    </>
                  ) : (
                    <>
                      <span>Total</span>
                      <span className="font-bold">{formatCurrency(exactTotal)} / {formatCurrency(totalAmount)}</span>
                    </>
                  )}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !!validationError || participants.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-green text-bg-base text-sm font-semibold hover:bg-accent-green-dim active:scale-[0.98] transition-all disabled:opacity-40"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Add ${formatCurrency(totalAmount)} expense`}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
