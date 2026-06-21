import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, SplitSquareVertical, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    const result = await login(data.email, data.password);
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-bg-surface items-center justify-center">
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(ellipse at 60% 40%, rgba(74,222,128,0.08) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(167,139,250,0.06) 0%, transparent 50%)' }} />

        <div className="relative z-10 px-12 max-w-md">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-accent-green/10 border border-accent-green/20 flex items-center justify-center">
                <SplitSquareVertical className="w-5 h-5 text-accent-green" />
              </div>
              <span className="text-xl font-bold text-text-primary">Splitwise</span>
            </div>

            <h1 className="text-4xl font-bold text-text-primary mb-4 leading-tight">
              Split expenses,<br />not friendships.
            </h1>
            <p className="text-text-secondary text-lg mb-10">
              Track shared costs, simplify debts, and settle up with anyone — all in one place.
            </p>

            {/* Floating expense cards */}
            <div className="space-y-3">
              {[
                { desc: 'Dinner at Nobu', amount: '$240', paidBy: 'Alex', color: 'accent-green' },
                { desc: 'Airbnb Tokyo', amount: '$1,200', paidBy: 'Sara', color: 'accent-purple' },
                { desc: 'Uber to airport', amount: '$48', paidBy: 'You', color: 'accent-blue' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="glass rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{item.desc}</p>
                    <p className="text-xs text-text-muted mt-0.5">Paid by {item.paidBy}</p>
                  </div>
                  <span className={`text-sm font-bold text-${item.color}`}>{item.amount}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-accent-green/10 border border-accent-green/20 flex items-center justify-center">
              <SplitSquareVertical className="w-4 h-4 text-accent-green" />
            </div>
            <span className="text-lg font-bold text-text-primary">Splitwise</span>
          </div>

          <h2 className="text-2xl font-bold text-text-primary mb-1">Sign in</h2>
          <p className="text-text-secondary mb-8">Welcome back. Enter your credentials.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted text-sm outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/20 transition-all"
              />
              {errors.email && <p className="text-accent-red text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-bg-card border border-border rounded-lg px-4 py-3 pr-10 text-text-primary placeholder-text-muted text-sm outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-accent-red text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-accent-green text-bg-base font-semibold py-3 rounded-lg text-sm hover:bg-accent-green-dim active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-text-muted text-sm mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-accent-green hover:underline font-medium">Create one</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
