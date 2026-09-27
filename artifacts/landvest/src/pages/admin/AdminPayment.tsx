import { useEffect, useState } from 'react';
import { CreditCard, Save, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdmin } from '@/context/AdminContext';
import { useToast } from '@/hooks/use-toast';

type PaymentDetails = {
  btcAddress: string;
  ethAddress: string;
  usdtAddress: string;
  usdcAddress: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  sortCode: string;
  reference: string;
};

export default function AdminPayment() {
  const { paymentDetails, updatePaymentDetails } = useAdmin();
  const { toast } = useToast();
  const [form, setForm] = useState<PaymentDetails>(paymentDetails);
  const [saved, setSaved] = useState(false);

  useEffect(() => setForm(paymentDetails), [paymentDetails]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSave = async () => {
    try {
      await updatePaymentDetails(form);
      setSaved(true);
      toast({ title: 'Payment Details Updated', description: 'All investor deposit addresses have been updated.' });
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      toast({ title: 'Unable to save payment details', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Payment Details</h1>
        <p className="text-slate-400 text-sm mt-1">Update crypto wallet addresses and bank transfer details shown to investors.</p>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white text-base">Cryptocurrency Addresses</CardTitle>
          <CardDescription className="text-slate-400">These addresses are shown to investors on the Deposit Funds page.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {[
            { key: 'btcAddress', label: 'Bitcoin (BTC) Address' },
            { key: 'ethAddress', label: 'Ethereum (ETH / ERC-20) Address' },
            { key: 'usdtAddress', label: 'USDT (TRC-20) Address' },
            { key: 'usdcAddress', label: 'USDC (ERC-20) Address' },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-slate-300 text-sm">{label}</Label>
              <Input value={form[key as keyof typeof form]} onChange={set(key as keyof typeof form)}
                className="bg-slate-700 border-slate-600 text-white font-mono text-xs" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white text-base">Bank Transfer Details</CardTitle>
          <CardDescription className="text-slate-400">Shown to investors who select bank wire transfer.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {[
            { key: 'bankName', label: 'Bank Name' },
            { key: 'accountName', label: 'Account Name' },
            { key: 'accountNumber', label: 'Account Number' },
            { key: 'sortCode', label: 'Sort Code' },
            { key: 'reference', label: 'Payment Reference Prefix' },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-slate-300 text-sm">{label}</Label>
              <Input value={form[key as keyof typeof form]} onChange={set(key as keyof typeof form)}
                className="bg-slate-700 border-slate-600 text-white" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 w-full sm:w-auto px-8">
        {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved!' : 'Save Payment Details'}
      </Button>
    </div>
  );
}
