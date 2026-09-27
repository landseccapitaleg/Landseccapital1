import { useState } from 'react';
import { ArrowUpCircle, Lock, CheckCircle2, Clock, AlertCircle, Wallet, Building2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const PLAN_TERM_LABELS: Record<string, string> = {
  'Foundation Plan': '12 Months',
  'Growth Plan': '24 Months',
  'Premier Plan': '36 Months',
  'Prestige Plan': '36 Months',
  'Institutional Plan': '48 Months',
  'Heritage Plan': '48 Months',
};

function CountdownBadge({ days }: { days: number }) {
  if (days === 0) return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Matured — Capital Available</Badge>;
  if (days <= 30) return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">{days} days remaining</Badge>;
  return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">{days} days remaining</Badge>;
}

export default function Withdraw() {
  const { user, updateUser, isCapitalMatured, daysToMaturity } = useAuth();
  const { toast } = useToast();

  const [profitAmount, setProfitAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [method, setMethod] = useState<'crypto' | 'bank'>('crypto');
  const [walletAddress, setWalletAddress] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const profit = user?.withdrawableProfit || 0;
  const capital = user?.investedAmount || 0;
  const matured = isCapitalMatured();
  const days = daysToMaturity();
  const maturityDate = user?.maturityDate ? new Date(user.maturityDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const termLabel = PLAN_TERM_LABELS[user?.plan || ''] || '12 Months';

  const handleProfitWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(profitAmount);
    if (!amt || amt <= 0) { toast({ title: 'Invalid amount', variant: 'destructive' }); return; }
    if (amt > profit) { toast({ title: 'Insufficient profit balance', description: `Your withdrawable profit is $${profit.toFixed(2)}.`, variant: 'destructive' }); return; }
    if (!walletAddress && method === 'crypto') { toast({ title: 'Wallet address required', variant: 'destructive' }); return; }
    if (!destination && method === 'bank') { toast({ title: 'Bank account details required', variant: 'destructive' }); return; }

    setSubmitting(true);
    const response = await fetch('/api/user/withdrawals', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: amt, method, destination: method === 'crypto' ? walletAddress : destination }) });
    const result = await response.json().catch(() => ({}));
    setSubmitting(false);
    if (response.ok) {
      if (result.user) updateUser(result.user);
      setSubmitted(true);
      toast({ title: 'Withdrawal Submitted', description: `$${amt.toFixed(2)} is being processed. You will receive a confirmation email shortly.` });
    } else {
      toast({ title: 'Withdrawal failed', description: result.error || 'Please try again.', variant: 'destructive' });
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <h1 className="font-serif text-3xl font-bold">Withdrawal Submitted</h1>
        <p className="text-muted-foreground max-w-md mx-auto">Your withdrawal request has been received and is being processed. Funds typically arrive within 1-3 business days depending on your chosen method.</p>
        <div className="grid sm:grid-cols-3 gap-4 pt-2 text-left">
          {[
            { label: 'Amount', value: `$${parseFloat(profitAmount).toFixed(2)}` },
            { label: 'Method', value: method === 'crypto' ? 'Cryptocurrency' : 'Bank Transfer' },
            { label: 'Status', value: 'Processing' },
          ].map(({ label, value }) => (
            <div key={label} className="p-4 rounded-xl border border-border/50 bg-card">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-semibold mt-0.5">{value}</p>
            </div>
          ))}
        </div>
        <Button variant="outline" onClick={() => { setSubmitted(false); setProfitAmount(''); setWalletAddress(''); setDestination(''); }}>
          Make Another Withdrawal
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold">Withdraw Funds</h1>
        <p className="text-muted-foreground mt-1">Withdraw your earned profit anytime. Capital is released on your plan maturity date.</p>
      </div>

      {/* Balance overview */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-500" />
              </div>
              <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">Available Now</Badge>
            </div>
            <p className="text-3xl font-serif font-bold text-green-500">${profit.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-1">Withdrawable Profit Balance</p>
            <p className="text-xs text-muted-foreground mt-2">Profit accumulates every 24 hours and is always withdrawable.</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Lock className="w-5 h-5 text-muted-foreground" />
              </div>
              <CountdownBadge days={days} />
            </div>
            <p className="text-3xl font-serif font-bold">${capital.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">Invested Capital</p>
            <p className="text-xs text-muted-foreground mt-2">
              {matured
                ? 'Your plan has matured. Capital is now available for withdrawal.'
                : `Locked until ${maturityDate} (${termLabel} term).`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
        <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <div className="text-sm space-y-1">
          <p className="font-semibold text-foreground">How withdrawals work</p>
          <p className="text-muted-foreground">
            Your daily profit accumulates every 24 hours and can be withdrawn at any time.
            Your invested capital of <strong className="text-foreground">${capital.toLocaleString()}</strong> is
            locked for the full <strong className="text-foreground">{termLabel}</strong> plan term
            and will be available from <strong className="text-foreground">{maturityDate}</strong>.
          </p>
        </div>
      </div>

      {/* Profit withdrawal form */}
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <ArrowUpCircle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle>Withdraw Profit</CardTitle>
              <CardDescription>Your available balance: <span className="font-semibold text-green-500">${profit.toFixed(2)}</span></CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {profit === 0 ? (
            <div className="text-center py-8 space-y-3">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
              <p className="font-semibold text-muted-foreground">No profit available yet</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">Your first profit cycle completes after 24 hours from your investment start date. Check back soon.</p>
            </div>
          ) : (
            <form onSubmit={handleProfitWithdraw} className="space-y-5">
              <div className="space-y-2">
                <Label>Withdrawal Amount ($)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="1"
                    max={profit}
                    value={profitAmount}
                    onChange={(e) => setProfitAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={() => setProfitAmount(profit.toFixed(2))}>Max</Button>
                </div>
                {profitAmount && parseFloat(profitAmount) > profit && (
                  <p className="text-xs text-destructive">Exceeds available profit balance.</p>
                )}
              </div>

              <Tabs value={method} onValueChange={(v) => setMethod(v as 'crypto' | 'bank')}>
                <TabsList className="w-full">
                  <TabsTrigger value="crypto" className="flex-1">Cryptocurrency</TabsTrigger>
                  <TabsTrigger value="bank" className="flex-1">Bank Transfer</TabsTrigger>
                </TabsList>

                <TabsContent value="crypto" className="mt-4 space-y-3">
                  <div className="space-y-2">
                    <Label>Wallet Address</Label>
                    <Input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="BTC / ETH / USDT wallet address" />
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-3 text-xs text-muted-foreground">
                    Double-check your wallet address. Transactions to wrong addresses cannot be reversed.
                  </div>
                </TabsContent>

                <TabsContent value="bank" className="mt-4 space-y-3">
                  <div className="space-y-2">
                    <Label>Account Name &amp; Bank</Label>
                    <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. John Smith — Barclays" />
                  </div>
                  <div className="space-y-2">
                    <Label>IBAN / Account Number</Label>
                    <Input placeholder="GB00 BARC 1234 5678 9012 34" />
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-3 text-xs text-muted-foreground">
                    Bank transfers typically take 1-3 business days to arrive.
                  </div>
                </TabsContent>
              </Tabs>

               <Button type="submit" className="w-full h-11 font-semibold" disabled={submitting || !profitAmount || parseFloat(profitAmount) <= 0}>
                <ArrowUpCircle className="w-4 h-4 mr-2" /> Submit Withdrawal Request
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Capital status */}
      {matured ? (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-6 flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <p className="font-semibold text-green-500">Your investment plan has matured</p>
              <p className="text-sm text-muted-foreground">Your capital of <strong className="text-foreground">${capital.toLocaleString()}</strong> is now available. Contact support to initiate your capital redemption.</p>
              <Button className="bg-green-600 hover:bg-green-700 text-white mt-2">Request Capital Redemption</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-6 flex items-start gap-4">
            <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Capital locked — {days} days until maturity</p>
              <p className="text-sm text-muted-foreground">Your <strong className="text-foreground">${capital.toLocaleString()}</strong> principal will be available for full redemption on <strong className="text-foreground">{maturityDate}</strong>.</p>
              <div className="mt-3 w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.max(0, 100 - (days / (365)) * 100))}%`
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Plan term progress</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
