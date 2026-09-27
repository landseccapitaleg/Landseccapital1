import { useState } from 'react';
import { Users, Search, Mail, ShieldCheck, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { sendEmail } from '@/lib/emailService';
import { useToast } from '@/hooks/use-toast';
import { useAdmin, AdminInvestor } from '@/context/AdminContext';

const kycColor: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-300',
  approved: 'bg-green-500/20 text-green-300',
  rejected: 'bg-red-500/20 text-red-300',
};

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const { users } = useAdmin();

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
       u.plan.toLowerCase().includes(search.toLowerCase())
  );

  const handleEmail = async (user: AdminInvestor) => {
    await sendEmail(user.email, 'custom', {
      name: user.name,
      subject: 'Message from Landsec Capital',
      heading: 'Important Update',
      body: 'Please log in to your investor dashboard for the latest updates on your portfolio.',
    });
    toast({ title: 'Email Sent', description: `Message sent to ${user.email}` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
       <p className="text-slate-400 text-sm mt-1">{users.length} registered investors</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, plan…"
            className="pl-9 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500" />
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.map((user) => (
          <Card key={user.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-400 font-bold text-sm">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 grid sm:grid-cols-5 gap-3">
                  <div className="sm:col-span-2">
                    <p className="text-sm font-semibold text-white">{user.name}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{user.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Plan</p>
                    <p className="text-sm text-white">{user.plan}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Invested</p>
                    <p className="text-sm font-semibold text-green-400">${user.investedAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">KYC</p>
                    <Badge className={`${kycColor[user.kycStatus] || kycColor.pending} text-xs mt-0.5`}>{user.kycStatus || 'pending'}</Badge>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline" onClick={() => handleEmail(user)} className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-1">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
