import { useState } from 'react';
import { CheckCircle2, XCircle, ArrowDownCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function AdminDeposits() {
  const { deposits, approveDeposit, rejectDeposit } = useAdmin();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const visible = filter === 'all' ? deposits : deposits.filter((d) => d.status === filter);

  const handleApprove = async (id: string) => {
    const dep = deposits.find((d) => d.id === id)!;
    await approveDeposit(id);
    await sendEmail(dep.userEmail, 'deposit', {
      name: dep.userName,
      amount: dep.amount.toLocaleString(),
      method: dep.method,
      txRef: dep.txRef,
      date: dep.date,
    });
    toast({ title: 'Deposit Approved', description: `$${dep.amount.toLocaleString()} approved. Notification sent to ${dep.userEmail}.` });
  };

  const handleReject = async (id: string) => {
    await rejectDeposit(id);
    toast({ title: 'Deposit Rejected', description: 'The deposit has been rejected.' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Deposit Approvals</h1>
          <p className="text-slate-400 text-sm mt-1">Review and approve investor deposit submissions.</p>
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
        {visible.length === 0 && (
          <div className="text-center py-16 text-slate-500">No {filter} deposits.</div>
        )}
        {visible.map((dep) => (
          <Card key={dep.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <ArrowDownCircle className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1 grid sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-slate-400">Investor</p>
                    <p className="text-sm font-semibold text-white">{dep.userName}</p>
                    <p className="text-xs text-slate-400">{dep.userEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Amount</p>
                    <p className="text-lg font-bold text-green-400">${dep.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Method / Ref</p>
                    <p className="text-sm text-white">{dep.method}</p>
                    <p className="text-xs text-slate-500 font-mono">{dep.txRef}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Date</p>
                    <p className="text-sm text-white flex items-center gap-1"><Clock className="w-3 h-3" /> {dep.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge className={statusColor[dep.status]}>{dep.status}</Badge>
                  {dep.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => handleApprove(dep.id)} className="bg-green-600 hover:bg-green-700 text-white gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(dep.id)} className="border-red-500/40 text-red-400 hover:bg-red-500/10 gap-1">
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
