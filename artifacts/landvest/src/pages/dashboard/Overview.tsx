import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, TrendingUp, Award, ArrowUpRight, Plus, FileText, Activity,
  ArrowUpCircle, Building2, ShoppingCart, X, MessageCircle, Mail, Phone as PhoneIcon,
  Lock, CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';

const PLAN_ANNUAL_RATE: Record<string, number> = {
  'Foundation Plan': 8, 'Growth Plan': 12, 'Premier Plan': 16,
  'Prestige Plan': 16, 'Institutional Plan': 20, 'Heritage Plan': 20,
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12)  return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function PropertyModal({ type, onClose }: { type: 'buy' | 'sell'; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 className="text-2xl font-serif font-bold mb-2">
          {type === 'buy' ? 'Buy a Property' : 'Sell a Property'}
        </h2>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          {type === 'buy'
            ? 'Interested in acquiring a property through Landsec Capital? Our advisors will guide you through available listings, due diligence, and the acquisition process.'
            : 'Looking to sell a property through our network? Our team will assess your asset and match it with qualified institutional buyers.'}
        </p>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-4 mb-6">
          <p className="text-sm font-semibold text-foreground">Contact our property team:</p>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Mail className="w-4 h-4 text-primary flex-shrink-0" />
            <a href="mailto:property@landseccapital.com" className="text-primary hover:underline font-medium">
              property@landseccapital.com
            </a>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <PhoneIcon className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="font-medium text-foreground">+44 20 7946 0321</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <MessageCircle className="w-4 h-4 text-primary flex-shrink-0" />
            <span>Live chat available Mon–Fri, 9am–6pm GMT</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button className="flex-1" asChild>
            <a href="mailto:property@landseccapital.com">
              <Mail className="w-4 h-4 mr-2" /> Email Us
            </a>
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">Close</Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Overview() {
  const { user, updateUser, isCapitalMatured } = useAuth();
  const { toast } = useToast();

  const [greeting, setGreeting]       = useState(getGreeting());
  const [today, setToday]             = useState(format(new Date(), 'EEEE, MMMM do, yyyy'));
  const [propertyModal, setPropertyModal] = useState<'buy' | 'sell' | null>(null);
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    const tick = setInterval(() => {
      setGreeting(getGreeting());
      setToday(format(new Date(), 'EEEE, MMMM do, yyyy'));
    }, 60 * 1000);
    return () => clearInterval(tick);
  }, []);

  const profit       = user?.withdrawableProfit || 0;
  const capital      = user?.investedAmount || 5000;
  const totalReturns = user?.totalReturns || 0;
  const annualRate   = PLAN_ANNUAL_RATE[user?.plan || ''] ?? 8;
  const portfolioValue = capital + totalReturns;
  const matured = isCapitalMatured();

  const chartData = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
    value: Math.round(capital * Math.pow(1 + annualRate / 100 / 12, i + 1)),
  }));

  const dailyProfit = capital * (annualRate / 100 / 365);

  const handleQuickWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmt);
    if (!amt || amt <= 0) { toast({ title: 'Enter a valid amount', variant: 'destructive' }); return; }
    if (amt > profit) { toast({ title: 'Insufficient profit balance', description: `Available: $${profit.toFixed(2)}`, variant: 'destructive' }); return; }
    setWithdrawing(true);
    const response = await fetch('/api/user/withdrawals', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: amt, method: 'crypto', destination: 'Nominated Account' }) });
    const result = await response.json().catch(() => ({}));
    setWithdrawing(false);
    if (response.ok) {
        if (result.user) updateUser(result.user);
        setWithdrawAmt('');
        toast({ title: 'Withdrawal Submitted', description: `$${amt.toFixed(2)} is being processed. Check your email for confirmation.` });
    } else toast({ title: 'Withdrawal failed', description: result.error || 'Please try again.', variant: 'destructive' });
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">

      {/* Property Modal */}
      <AnimatePresence>
        {propertyModal && (
          <PropertyModal type={propertyModal} onClose={() => setPropertyModal(null)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">
            {greeting}, {user?.name.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground mt-1">{today}</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href="/dashboard/deposit">
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Funds</Button>
          </Link>
          <Link href="/dashboard/documents">
            <Button variant="outline" className="hidden sm:flex gap-2"><FileText className="w-4 h-4" /> Statements</Button>
          </Link>
        </div>
      </div>

      {/* Stat cards — stacked */}
      <div className="flex flex-col gap-4">

        {/* Card 1 — Total Invested */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <Badge variant="outline" className="text-xs bg-background">Total Invested</Badge>
              </div>
              <h3 className="text-4xl font-bold font-serif mb-1">${capital.toLocaleString()}</h3>
              <p className="text-sm text-muted-foreground">Initial principal</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 2 — Portfolio Value */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.07 }}>
          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-semibold text-green-600 flex items-center bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-md">
                  <ArrowUpRight className="w-3 h-3 mr-1" /> {annualRate}.0%
                </span>
              </div>
              <h3 className="text-4xl font-bold font-serif mb-1 text-primary">
                ${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-sm text-primary font-medium">Current portfolio value</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 3 — Active Plan */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.14 }}>
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Award className="w-5 h-5 text-secondary-foreground" />
                </div>
              </div>
              <h3 className="text-2xl font-bold font-serif mb-1">{user?.plan}</h3>
              <p className="text-sm text-muted-foreground mt-1">Active Strategy</p>
              <Link href="/dashboard/investments" className="text-xs font-medium text-primary hover:underline mt-3 inline-block">
                Upgrade Plan &rarr;
              </Link>
            </CardContent>
          </Card>
        </motion.div>

      </div>

      {/* ── Withdrawal Section ── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}>
        <Card className={`border shadow-sm ${profit > 0 ? 'border-green-500/30 bg-green-500/5' : 'border-border/50'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${profit > 0 ? 'bg-green-500/15' : 'bg-secondary'}`}>
                  <ArrowUpCircle className={`w-5 h-5 ${profit > 0 ? 'text-green-500' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Withdraw Profit</CardTitle>
                  <CardDescription className="text-xs">
                    Available balance: <span className={`font-semibold ${profit > 0 ? 'text-green-500' : 'text-foreground'}`}>${profit.toFixed(2)}</span>
                  </CardDescription>
                </div>
              </div>
              <Link href="/dashboard/withdraw">
                <Button variant="ghost" size="sm" className="text-xs text-primary gap-1 h-7">
                  Full page &rarr;
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {profit <= 0 ? (
              <div className="flex items-center gap-3 py-3 px-4 rounded-lg bg-secondary/40 text-sm text-muted-foreground">
                <Lock className="w-4 h-4 flex-shrink-0" />
                <span>Profit accumulates every 24 hours. Your first cycle will be available soon.</span>
              </div>
            ) : (
              <form onSubmit={handleQuickWithdraw} className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="1"
                    max={profit}
                    value={withdrawAmt}
                    onChange={(e) => setWithdrawAmt(e.target.value)}
                    placeholder="Amount"
                    className="pl-7"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="text-xs px-3"
                  onClick={() => setWithdrawAmt(profit.toFixed(2))}
                >
                  Max
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white gap-1.5 whitespace-nowrap"
                  disabled={withdrawing || !withdrawAmt}
                >
                  {withdrawing ? (
                    <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing…</span>
                  ) : (
                    <><ArrowUpCircle className="w-4 h-4" /> Withdraw</>
                  )}
                </Button>
              </form>
            )}

            {/* Capital status */}
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              {matured
                ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> <span>Capital matured — <Link href="/dashboard/withdraw" className="text-primary hover:underline">request redemption</Link></span></>
                : <><Lock className="w-3.5 h-3.5" /> <span>Capital of <strong className="text-foreground">${capital.toLocaleString()}</strong> locked until {user?.maturityDate ? new Date(user.maturityDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span></>
              }
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Buy / Sell Properties ── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.27 }}>
        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-serif font-bold">Property Transactions</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Buy or sell real estate assets through our institutional network.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Buy */}
            <button
              onClick={() => setPropertyModal('buy')}
              className="text-left group w-full"
            >
              <Card className="border-border/50 shadow-sm hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer group-hover:bg-primary/5">
                <CardContent className="p-6">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-serif font-bold text-lg mb-1">Buy Property</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Acquire residential or commercial assets through our vetted UK property network.
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-4 group-hover:underline">
                    Get started &rarr;
                  </span>
                </CardContent>
              </Card>
            </button>

            {/* Sell */}
            <button
              onClick={() => setPropertyModal('sell')}
              className="text-left group w-full"
            >
              <Card className="border-border/50 shadow-sm hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer group-hover:bg-primary/5">
                <CardContent className="p-6">
                  <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                    <Building2 className="w-5 h-5 text-secondary-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-serif font-bold text-lg mb-1">Sell Property</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    List your property with Landsec Capital and reach institutional buyers across the UK.
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-4 group-hover:underline">
                    Get started &rarr;
                  </span>
                </CardContent>
              </Card>
            </button>

          </div>
        </div>
      </motion.div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="col-span-1 lg:col-span-2 shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="font-serif">Projected Portfolio Growth</CardTitle>
            <CardDescription>{annualRate}% annual return — 12-month outlook</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `$${v}`} dx={-10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                    formatter={(v: number) => [`$${v.toLocaleString()}`, 'Projected Value']}
                  />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-serif text-lg">Recent Activity</CardTitle>
            <Link href="/dashboard/transactions" className="text-xs font-medium text-primary hover:underline">View All</Link>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground mt-3">No transactions recorded yet.</p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
