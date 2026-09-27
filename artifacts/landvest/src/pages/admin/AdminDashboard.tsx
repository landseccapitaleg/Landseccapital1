import { ArrowDownCircle, ArrowUpCircle, ShieldCheck, Users, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdmin } from '@/context/AdminContext';

export default function AdminDashboard() {
  const { deposits, withdrawals, kycRequests, users } = useAdmin();

  const pending = (arr: { status: string }[]) => arr.filter((x) => x.status === 'pending').length;
  const approved = (arr: { status: string }[]) => arr.filter((x) => x.status === 'approved').length;

  const totalDepositVolume = deposits.filter((d) => d.status === 'approved').reduce((s, d) => s + d.amount, 0);
  const totalWithdrawalVolume = withdrawals.filter((w) => w.status === 'approved').reduce((s, w) => s + w.amount, 0);

  const stats = [
    { label: 'Pending Deposits', value: pending(deposits), icon: ArrowDownCircle, color: 'text-blue-400', bg: 'bg-blue-500/10', urgent: pending(deposits) > 0 },
    { label: 'Pending Withdrawals', value: pending(withdrawals), icon: ArrowUpCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', urgent: pending(withdrawals) > 0 },
    { label: 'Pending KYC', value: pending(kycRequests), icon: ShieldCheck, color: 'text-purple-400', bg: 'bg-purple-500/10', urgent: pending(kycRequests) > 0 },
    { label: 'Total Investors', value: users.length, icon: Users, color: 'text-green-400', bg: 'bg-green-500/10', urgent: false },
    { label: 'Deposits Approved', value: `$${totalDepositVolume.toLocaleString()}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10', urgent: false },
    { label: 'Withdrawals Sent', value: `$${totalWithdrawalVolume.toLocaleString()}`, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10', urgent: false },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Landsec Capital — Control Panel Overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, urgent }) => (
          <Card key={label} className={`bg-slate-800 border-slate-700 ${urgent ? 'border-red-500/40' : ''}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                {urgent && <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Action needed</Badge>}
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-400 mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="border-b border-slate-700 pb-4">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <p className="px-5 py-8 text-sm text-slate-500">Activity will appear here as operations are recorded.</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="border-b border-slate-700 pb-4">
            <CardTitle className="text-white text-base">Platform Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {[
              ['Assets Under Management', '—'],
              ['Total Investors', users.length.toLocaleString()],
              ['Average Annual Return', '—'],
              ['Operating Since', '—'],
              ['Plans Available', '4'],
              ['KYC Completion Rate', users.length ? `${Math.round(users.filter(u => u.kycStatus === 'approved').length / users.length * 100)}%` : '—'],
              ['Deposits (This Month)', `$${totalDepositVolume.toLocaleString()}`],
              ['Withdrawals (This Month)', `$${totalWithdrawalVolume.toLocaleString()}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center py-1.5 border-b border-slate-700/40 last:border-0">
                <span className="text-sm text-slate-400">{k}</span>
                <span className="text-sm font-semibold text-white">{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
