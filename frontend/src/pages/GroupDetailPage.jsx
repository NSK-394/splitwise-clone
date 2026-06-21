import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, UserPlus, Receipt, BarChart2, ArrowRightLeft,
  Loader2, X, TrendingUp, TrendingDown, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getGroup, addMember } from '../api/groupsApi';
import { getExpenses, getBalances, getSimplifiedDebts } from '../api/expensesApi';
import { createSettlement, getSettlements } from '../api/settlementsApi';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getAvatarColor } from '../lib/utils';
import { Avatar } from '../components/layout/AppLayout';
import AddExpenseModal from '../components/AddExpenseModal';

const TABS = [
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'balances', label: 'Balances', icon: BarChart2 },
  { id: 'settle', label: 'Settle Up', icon: ArrowRightLeft },
];

const CATEGORY_COLORS = ['#4ade80', '#60a5fa', '#a78bfa', '#f472b6', '#fb923c', '#fbbf24'];

function ExpenseCard({ expense, currentUserId }) {
  const paidByMe = expense.paidBy._id === currentUserId;
  const myShare = expense.splits.find((s) => s.user._id === currentUserId)?.amount ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-card border border-border rounded-xl p-4 hover:border-border-hover transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-text-primary text-sm truncate">{expense.description}</p>
            <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-bg-elevated border border-border text-text-muted capitalize">
              {expense.splitType}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Avatar name={expense.paidBy.name} size="sm" />
            <span>
              <span className="text-text-secondary">{paidByMe ? 'You' : expense.paidBy.name}</span> paid {formatCurrency(expense.amount)}
            </span>
            <span>·</span>
            <span>{format(new Date(expense.createdAt), 'MMM d')}</span>
          </div>
        </div>

        <div className="text-right shrink-0">
          {paidByMe ? (
            <div>
              <p className="text-xs text-text-muted">you lent</p>
              <p className="text-sm font-bold text-accent-green">
                {formatCurrency(expense.amount - myShare)}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-text-muted">your share</p>
              <p className="text-sm font-bold text-accent-red">{formatCurrency(myShare)}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function BalancesTab({ groupId, members, currentUserId }) {
  const [balances, setBalances] = useState([]);
  const [debts, setDebts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, dRes, eRes] = await Promise.all([
        getBalances(groupId),
        getSimplifiedDebts(groupId),
        getExpenses(groupId),
      ]);
      setBalances(bRes.data);
      setDebts(dRes.data);
      setExpenses(eRes.data);
    } catch {
      toast.error('Failed to load balances.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 text-accent-green animate-spin" /></div>
  );

  // Build pie data from expenses
  const categoryMap = {};
  expenses.forEach((e) => {
    const cat = e.category || 'general';
    categoryMap[cat] = (categoryMap[cat] || 0) + e.amount;
  });
  const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* Member balances */}
      <div>
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Net balances</h3>
        <div className="space-y-2">
          {balances.map(({ user, balance }) => (
            <div key={user._id} className="bg-bg-card border border-border rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={user.name} size="md" />
                <span className="text-sm font-medium text-text-primary">{user._id === currentUserId ? 'You' : user.name}</span>
              </div>
              <div className={`flex items-center gap-1.5 ${balance >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                {balance >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="font-bold text-sm">{formatCurrency(Math.abs(balance))}</span>
                <span className="text-xs opacity-70">{balance >= 0 ? 'owed' : 'owes'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Simplified debts */}
      {debts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Simplified debts</h3>
          <div className="space-y-2">
            {debts.map((d, i) => (
              <div key={i} className="bg-accent-red/5 border border-accent-red/15 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Avatar name={d.from.name} size="sm" />
                  <span className="text-text-secondary">{d.from._id === currentUserId ? 'You' : d.from.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                  <Avatar name={d.to.name} size="sm" />
                  <span className="text-text-secondary">{d.to._id === currentUserId ? 'You' : d.to.name}</span>
                </div>
                <span className="font-bold text-accent-red text-sm">{formatCurrency(d.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spending chart */}
      {pieData.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Spending breakdown</h3>
          <div className="bg-bg-card border border-border rounded-xl p-4">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e2438', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#f1f5f9' }}
                  formatter={(value) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {pieData.map((entry, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                  <span className="capitalize">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettleUpTab({ groupId, members, currentUserId, onSettled }) {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [settlements, setSettlements] = useState([]);
  const [debts, setDebts] = useState([]);

  useEffect(() => {
    Promise.all([getSettlements(groupId), getSimplifiedDebts(groupId)]).then(([sRes, dRes]) => {
      setSettlements(sRes.data);
      setDebts(dRes.data);
    }).catch(() => {});
  }, [groupId]);

  const myDebts = debts.filter((d) => d.from._id === currentUserId);

  const handleSettle = async (e) => {
    e.preventDefault();
    if (!to || !amount) return;
    setLoading(true);
    try {
      await createSettlement(groupId, { to, amount: Number(amount), note });
      toast.success('Settlement recorded!');
      setTo(''); setAmount(''); setNote('');
      const [sRes, dRes] = await Promise.all([getSettlements(groupId), getSimplifiedDebts(groupId)]);
      setSettlements(sRes.data);
      setDebts(dRes.data);
      onSettled?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record settlement.');
    } finally {
      setLoading(false);
    }
  };

  const others = members.filter((m) => m._id !== currentUserId);

  return (
    <div className="space-y-6">
      {myDebts.length > 0 && (
        <div className="bg-accent-amber/5 border border-accent-amber/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-accent-amber uppercase tracking-wide mb-2">Suggested payments</p>
          {myDebts.map((d, i) => (
            <button
              key={i}
              onClick={() => { setTo(d.to._id); setAmount(d.amount.toFixed(2)); }}
              className="w-full flex items-center justify-between text-sm text-text-primary hover:bg-bg-hover rounded-lg p-2 transition-colors"
            >
              <span>Pay {d.to.name}</span>
              <span className="font-bold text-accent-red">{formatCurrency(d.amount)}</span>
            </button>
          ))}
        </div>
      )}

      <div className="bg-bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Record a payment</h3>
        <form onSubmit={handleSettle} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Paying to</label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/20 transition-all"
            >
              <option value="">Select person...</option>
              {others.map((m) => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Amount</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2.5 text-text-primary placeholder-text-muted text-sm outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Note <span className="text-text-muted">(optional)</span></label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Venmo, cash, etc."
              className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2.5 text-text-primary placeholder-text-muted text-sm outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/20 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !to || !amount}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent-green text-bg-base text-sm font-semibold hover:bg-accent-green-dim active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Payment'}
          </button>
        </form>
      </div>

      {settlements.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Settlement history</h3>
          <div className="space-y-2">
            {settlements.map((s) => (
              <div key={s._id} className="bg-bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Avatar name={s.from.name} size="sm" />
                  <span className="text-text-secondary">{s.from._id === currentUserId ? 'You' : s.from.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                  <Avatar name={s.to.name} size="sm" />
                  <span className="text-text-secondary">{s.to._id === currentUserId ? 'You' : s.to.name}</span>
                  {s.note && <span className="text-text-muted">· {s.note}</span>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-accent-green">{formatCurrency(s.amount)}</p>
                  <p className="text-xs text-text-muted">{format(new Date(s.date), 'MMM d')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AddMemberModal({ groupId, onClose, onAdded }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { data } = await addMember(groupId, { email: email.trim() });
      toast.success('Member added!');
      onAdded(data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-bg-elevated border border-border rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-text-primary">Add member</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Email address</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="friend@example.com"
              autoFocus
              className="w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted text-sm outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/20 transition-all"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-text-secondary text-sm hover:border-border-hover transition-all">Cancel</button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent-green text-bg-base text-sm font-semibold hover:bg-accent-green-dim active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function GroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [tab, setTab] = useState('expenses');
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  const loadGroup = useCallback(async () => {
    try {
      const [gRes, eRes] = await Promise.all([getGroup(id), getExpenses(id)]);
      setGroup(gRes.data);
      setExpenses(eRes.data);
    } catch {
      toast.error('Failed to load group.');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { loadGroup(); }, [loadGroup]);

  const reloadExpenses = async () => {
    const { data } = await getExpenses(id);
    setExpenses(data);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-6 h-6 text-accent-green animate-spin" />
    </div>
  );

  if (!group) return null;

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-text-muted hover:text-text-secondary text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary">{group.name}</h1>
            {group.description && <p className="text-text-muted text-sm mt-0.5">{group.description}</p>}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex -space-x-2">
                {group.members.slice(0, 5).map((m) => (
                  <div key={m._id} title={m.name}><Avatar name={m.name} size="sm" /></div>
                ))}
              </div>
              <span className="text-xs text-text-muted">{group.members.length} members</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-text-secondary text-sm hover:border-border-hover hover:text-text-primary transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add member</span>
            </button>
            <button
              onClick={() => setShowAddExpense(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent-green text-bg-base text-sm font-semibold hover:bg-accent-green-dim active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-bg-surface rounded-xl mb-6 border border-border">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === tabId
                ? 'bg-bg-elevated text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {tab === 'expenses' && (
            <div className="space-y-3">
              {expenses.length === 0 ? (
                <div className="text-center py-16 border border-border border-dashed rounded-2xl">
                  <Receipt className="w-10 h-10 text-text-muted mx-auto mb-3" />
                  <p className="text-text-secondary font-medium">No expenses yet</p>
                  <p className="text-text-muted text-sm mt-1 mb-4">Add the first expense for this group</p>
                  <button
                    onClick={() => setShowAddExpense(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-green text-bg-base text-sm font-semibold hover:bg-accent-green-dim transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add expense
                  </button>
                </div>
              ) : (
                expenses.map((e) => (
                  <ExpenseCard key={e._id} expense={e} currentUserId={user?._id} />
                ))
              )}
            </div>
          )}

          {tab === 'balances' && (
            <BalancesTab groupId={id} members={group.members} currentUserId={user?._id} />
          )}

          {tab === 'settle' && (
            <SettleUpTab
              groupId={id}
              members={group.members}
              currentUserId={user?._id}
              onSettled={reloadExpenses}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showAddExpense && (
          <AddExpenseModal
            groupId={id}
            members={group.members}
            currentUserId={user?._id}
            onClose={() => setShowAddExpense(false)}
            onAdded={(expense) => {
              setExpenses((prev) => [expense, ...prev]);
              setShowAddExpense(false);
            }}
          />
        )}
        {showAddMember && (
          <AddMemberModal
            groupId={id}
            onClose={() => setShowAddMember(false)}
            onAdded={(updatedGroup) => setGroup(updatedGroup)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
