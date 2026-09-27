import { useState } from 'react';
import { CheckCircle2, XCircle, ArrowUpCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdmin } from '@/context/AdminContext';
import { sendEmail } from '@/lib/emailService';
import { useToast } from '@/hooks/use-toast';

const statusColor: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  approved: 'bg-green-500/20 text-green-300 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
};

export default function AdminWithdrawals() {
  const { withdrawals, approveWithdrawal, rejectWithdrawal } = useAdmin();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const visible = filter === 'all' ? withdrawals : withdrawals.filter((w) => w.status === filter);

  const handleApprove = async (id: string) => {
    const wd = withdrawals.find((w) => w.id === id)!;
    await approveWithdrawal(id);
    await sendEmail(wd.userEmail, 'withdrawal_approved', {
      name: wd.userName,
      amount: wd.amount.toLocaleString(),
      destination: wd.destination,
      txRef: wd.id,
    });
    toast({ title: 'Withdrawal Approved', description: `Funds dispatched. Notification sent to ${wd.userEmail}.` });
  };

  const handleReject = async (id: string) => {
    const wd = withdrawals.find((w) => w.id === id)!;
    await rejectWithdrawal(id);
    toast({ title: 'Withdrawal Rejected', description: `Withdrawal for ${wd.userName} has been rejected.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Withdrawal Approvals</h1>
          <p className="text-slate-400 text-sm mt-1">Review and approve investor withdrawal requests.</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}
              className={filter === f ? 'bg-blue-600 text-white' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {visible.length === 0 && <div className="text-center py-16 text-slate-500">No {filter} withdrawals.</div>}
        {visible.map((wd) => (
          <Card key={wd.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <ArrowUpCircle className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1 grid sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-slate-400">Investor</p>
                    <p className="text-sm font-semibold text-white">{wd.userName}</p>
                    <p className="text-xs text-slate-400">{wd.userEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Amount</p>
                    <p className="text-lg font-bold text-amber-400">${wd.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Destination</p>
                    <p className="text-sm text-white">{wd.destination}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Submitted</p>
                    <p className="text-sm text-white flex items-center gap-1"><Clock className="w-3 h-3" /> {wd.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge className={statusColor[wd.status]}>{wd.status}</Badge>
                  {wd.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => handleApprove(wd.id)} className="bg-green-600 hover:bg-green-700 text-white gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(wd.id)} className="border-red-500/40 text-red-400 hover:bg-red-500/10 gap-1">
                        <XCircle className="w-4 h-4" /> Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
