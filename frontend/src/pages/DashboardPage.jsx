import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, TrendingUp, TrendingDown, Loader2, X, SplitSquareVertical } from 'lucide-react';
import { toast } from 'sonner';
import { getGroups, createGroup } from '../api/groupsApi';
import { getBalances } from '../api/expensesApi';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getInitials, getAvatarColor } from '../lib/utils';
import { Avatar } from '../components/layout/AppLayout';

function StatCard({ label, amount, type }) {
  const isPositive = type === 'owed';
  return (
    <div className={`rounded-xl p-4 border ${isPositive ? 'bg-accent-green/5 border-accent-green/15' : 'bg-accent-red/5 border-accent-red/15'}`}>
      <div className={`flex items-center gap-2 mb-2 ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
        {formatCurrency(Math.abs(amount))}
      </p>
    </div>
  );
}

function GroupCard({ group, balance, onClick }) {
  const isPositive = balance >= 0;
  const memberCount = group.members.length;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-border-hover transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-accent-purple" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary text-sm leading-tight">{group.name}</h3>
            <p className="text-xs text-text-muted mt-0.5">{memberCount} member{memberCount !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className={`text-right ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
          <p className="text-xs font-medium">{isPositive ? 'you get back' : 'you owe'}</p>
          <p className="text-base font-bold">{formatCurrency(Math.abs(balance))}</p>
        </div>
      </div>

      {/* Member avatars */}
      <div className="flex items-center gap-1">
        <div className="flex -space-x-2">
          {group.members.slice(0, 4).map((m) => (
            <div key={m._id} title={m.name}>
              <Avatar name={m.name} size="sm" />
            </div>
          ))}
          {group.members.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-xs text-text-muted">
              +{group.members.length - 4}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CreateGroupModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const { data } = await createGroup({ name: name.trim(), description: description.trim() });
      toast.success(`Group "${data.name}" created!`);
      onCreated(data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group.');
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
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-bg-elevated border border-border rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-text-primary">Create new group</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Group name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tokyo Trip, Apartment 4B"
              autoFocus
              className="w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted text-sm outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Description <span className="text-text-muted">(optional)</span></label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group for?"
              className="w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted text-sm outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/20 transition-all"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-text-secondary text-sm font-medium hover:border-border-hover hover:text-text-primary transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent-green text-bg-base text-sm font-semibold hover:bg-accent-green-dim active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Group'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getGroups();
        setGroups(data);

        const bals = {};
        await Promise.all(
          data.map(async (g) => {
            try {
              const { data: b } = await getBalances(g._id);
              const mine = b.find((x) => x.user._id === user?._id);
              bals[g._id] = mine?.balance ?? 0;
            } catch {
              bals[g._id] = 0;
            }
          })
        );
        setBalances(bals);
      } catch {
        toast.error('Failed to load groups.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const totalOwed = Object.values(balances).filter((b) => b > 0).reduce((s, b) => s + b, 0);
  const totalOwing = Object.values(balances).filter((b) => b < 0).reduce((s, b) => s + b, 0);

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
          <span className="text-accent-green">{user?.name?.split(' ')[0]}</span>
        </h1>
        <p className="text-text-secondary mt-1">Here's your expense overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard label="You're owed" amount={totalOwed} type="owed" />
        <StatCard label="You owe" amount={totalOwing} type="owing" />
      </div>

      {/* Groups header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-text-primary">Your groups</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent-green text-bg-base text-sm font-semibold hover:bg-accent-green-dim active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          New group
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-accent-green animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 border border-border border-dashed rounded-2xl"
        >
          <div className="w-14 h-14 rounded-2xl bg-bg-elevated flex items-center justify-center mx-auto mb-4">
            <SplitSquareVertical className="w-7 h-7 text-text-muted" />
          </div>
          <p className="text-text-primary font-medium mb-1">No groups yet</p>
          <p className="text-text-muted text-sm mb-5">Create a group to start splitting expenses</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-green text-bg-base text-sm font-semibold hover:bg-accent-green-dim transition-all"
          >
            <Plus className="w-4 h-4" /> Create your first group
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {groups.map((g) => (
            <motion.div
              key={g._id}
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
            >
              <GroupCard
                group={g}
                balance={balances[g._id] ?? 0}
                onClick={() => navigate(`/groups/${g._id}`)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {showCreate && (
          <CreateGroupModal
            onClose={() => setShowCreate(false)}
            onCreated={(g) => setGroups((prev) => [g, ...prev])}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
