import { useState } from 'react';
import { CheckCircle2, XCircle, ShieldCheck, Clock, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdmin } from '@/context/AdminContext';
import { sendEmail } from '@/lib/emailService';
import { useToast } from '@/hooks/use-toast';

const statusColor: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  approved: 'bg-green-500/20 text-green-300 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
};

export default function AdminKYC() {
  const { kycRequests, approveKYC, rejectKYC } = useAdmin();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const visible = filter === 'all' ? kycRequests : kycRequests.filter((k) => k.status === filter);

  const handleApprove = async (id: string) => {
    const kyc = kycRequests.find((k) => k.id === id)!;
    await approveKYC(id);
    await sendEmail(kyc.userEmail, 'kyc_approved', {
      name: kyc.userName,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    });
    toast({ title: 'KYC Approved', description: `${kyc.userName}'s identity has been verified. Email sent.` });
  };

  const handleReject = async (id: string) => {
    const kyc = kycRequests.find((k) => k.id === id)!;
    await rejectKYC(id, rejectReason);
    await sendEmail(kyc.userEmail, 'kyc_rejected', { name: kyc.userName, reason: rejectReason });
    setRejectingId(null);
    setRejectReason('');
    toast({ title: 'KYC Rejected', description: `${kyc.userName} notified to resubmit.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">KYC Approvals</h1>
          <p className="text-slate-400 text-sm mt-1">Review investor identity submissions.</p>
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
        {visible.length === 0 && <div className="text-center py-16 text-slate-500">No {filter} KYC requests.</div>}
        {visible.map((kyc) => (
          <Card key={kyc.id} className="bg-slate-800 border-slate-700">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 grid sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-slate-400">Investor</p>
                    <p className="text-sm font-semibold text-white">{kyc.userName}</p>
                    <p className="text-xs text-slate-400">{kyc.userEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Document Type</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <p className="text-sm text-white">{kyc.docType}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Submitted</p>
                    <p className="text-sm text-white flex items-center gap-1"><Clock className="w-3 h-3" /> {kyc.submittedDate}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={statusColor[kyc.status]}>{kyc.status}</Badge>
                  </div>
                </div>
                {kyc.status === 'pending' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" onClick={() => handleApprove(kyc.id)} className="bg-green-600 hover:bg-green-700 text-white gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRejectingId(kyc.id)} className="border-red-500/40 text-red-400 hover:bg-red-500/10 gap-1">
                      <XCircle className="w-4 h-4" /> Reject
                    </Button>
                  </div>
                )}
              </div>

              {rejectingId === kyc.id && (
                <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                  <Label className="text-slate-300">Rejection Reason (sent to investor)</Label>
                  <Input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Document unclear, please resubmit with higher quality scan"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleReject(kyc.id)} className="bg-red-600 hover:bg-red-700 text-white">Send Rejection</Button>
                    <Button size="sm" variant="outline" onClick={() => setRejectingId(null)} className="border-slate-600 text-slate-300">Cancel</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
