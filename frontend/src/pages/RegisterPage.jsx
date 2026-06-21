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
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function RegisterPage() {
  const { register: registerUser, loading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    const result = await registerUser(data.name, data.email, data.password);
    if (result.success) {
      toast.success('Account created! Welcome to Splitwise.');
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
          style={{ backgroundImage: 'radial-gradient(ellipse at 40% 60%, rgba(167,139,250,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(74,222,128,0.06) 0%, transparent 50%)' }} />

        <div className="relative z-10 px-12 max-w-md">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-accent-green/10 border border-accent-green/20 flex items-center justify-center">
                <SplitSquareVertical className="w-5 h-5 text-accent-green" />
              </div>
              <span className="text-xl font-bold text-text-primary">Splitwise</span>
            </div>

            <h1 className="text-4xl font-bold text-text-primary mb-4 leading-tight">
              Split any expense<br />with anyone.
            </h1>
            <p className="text-text-secondary text-lg mb-10">
              Roommates, travel buddies, office lunches — manage it all without the awkward money talks.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Equal split', icon: '⚖️', desc: 'Divide equally' },
                { label: 'Custom split', icon: '✂️', desc: 'Set percentages' },
                { label: 'Exact amounts', icon: '🎯', desc: 'Precise control' },
                { label: 'Settle up', icon: '✅', desc: 'Minimal payments' },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="glass rounded-xl p-4"
                >
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <p className="text-sm font-semibold text-text-primary">{f.label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{f.desc}</p>
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
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-accent-green/10 border border-accent-green/20 flex items-center justify-center">
              <SplitSquareVertical className="w-4 h-4 text-accent-green" />
            </div>
            <span className="text-lg font-bold text-text-primary">Splitwise</span>
          </div>

          <h2 className="text-2xl font-bold text-text-primary mb-1">Create account</h2>
          <p className="text-text-secondary mb-8">Start splitting expenses in seconds.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Full name</label>
              <input
                {...register('name')}
                placeholder="Alex Johnson"
                className="w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted text-sm outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/20 transition-all"
              />
              {errors.name && <p className="text-accent-red text-xs mt-1">{errors.name.message}</p>}
            </div>

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
                  placeholder="At least 6 characters"
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
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-text-muted text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-green hover:underline font-medium">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
