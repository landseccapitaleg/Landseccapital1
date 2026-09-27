import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Copy, QrCode, Building2, UploadCloud, CheckCircle2 } from 'lucide-react';

const cryptoAssets = [
  { id: 'BTC', name: 'Bitcoin', network: 'BTC', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' },
  { id: 'ETH', name: 'Ethereum', network: 'ERC-20', address: '0x742d35Cc6634C0532925a3b8D4C9C4B0e5f2a1b9' },
  { id: 'USDT', name: 'USDT', network: 'TRC-20', address: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE' },
  { id: 'USDC', name: 'USDC', network: 'ERC-20', address: '0x742d35Cc6634C0532925a3b8D4C9C4B0e5f2a1b9' },
];

export default function Deposit() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeCrypto, setActiveCrypto] = useState(cryptoAssets[0]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'pending' | 'review' | 'submitting'>('pending');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Address copied!', description: 'Wallet address copied to clipboard.' });
  };

  const handleCryptoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txHash || !amount) {
      toast({ title: 'Error', description: 'Please provide transaction hash and amount.', variant: 'destructive' });
      return;
    }
    setStatus('submitting');
    const response = await fetch('/api/user/deposits', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: Number(amount), method: activeCrypto.id, txRef: txHash }) });
    if (!response.ok) { setStatus('pending'); toast({ title: 'Deposit submission failed', description: 'Please try again.', variant: 'destructive' }); return; }
    setStatus('review');
    toast({ title: 'Deposit Submitted', description: 'Your deposit is pending review.' });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Add Funds</h1>
        <p className="text-muted-foreground mt-1">Fund your account via Cryptocurrency or Bank Transfer.</p>
      </div>

      <div className="bg-primary/10 text-primary p-4 rounded-lg flex items-start gap-3 border border-primary/20">
        <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold mb-1">Instant Processing</p>
          <p className="text-foreground/70">Your funds are credited automatically once your transaction is confirmed on the blockchain.</p>
        </div>
      </div>

      <Tabs defaultValue="crypto" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-8">
          <TabsTrigger value="crypto">Cryptocurrency</TabsTrigger>
          <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
        </TabsList>

        <TabsContent value="crypto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-3">
              {cryptoAssets.map((c) => (
                <Card 
                  key={c.id} 
                  className={`cursor-pointer transition-colors ${activeCrypto.id === c.id ? 'border-primary shadow-md bg-primary/5' : 'hover:border-primary/50'}`}
                  onClick={() => { setActiveCrypto(c); setShowConfirm(false); setStatus('pending'); }}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold">{c.name}</h4>
                      <p className="text-xs text-muted-foreground">{c.network}</p>
                    </div>
                    <Badge variant="outline">{c.id}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      Deposit {activeCrypto.name} 
                      <Badge className="ml-2 bg-secondary text-secondary-foreground">{activeCrypto.network}</Badge>
                    </CardTitle>
                  </div>
                  <CardDescription>Minimum deposit: $100</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   {status === 'review' || status === 'submitting' ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="w-16 h-16 bg-primary/15 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                       <h3 className="text-xl font-bold">Deposit Pending</h3>
                       <p className="text-muted-foreground max-w-sm mx-auto">Your deposit has been submitted and will be reviewed before your balance is updated.</p>
                      <Button variant="outline" onClick={() => { setStatus('pending'); setShowConfirm(false); setTxHash(''); setAmount(''); }}>Make Another Deposit</Button>
                    </div>
                  ) : !showConfirm ? (
                    <>
                      <div className="flex justify-center p-6 bg-secondary/30 rounded-lg border border-border/50">
                        <div className="text-center space-y-2">
                          <QrCode className="w-32 h-32 mx-auto text-muted-foreground opacity-50" />
                          <p className="text-sm text-muted-foreground">Scan QR Code</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Wallet Address</label>
                        <div className="flex gap-2">
                          <Input readOnly value={activeCrypto.address} className="font-mono text-xs bg-secondary/30" />
                          <Button variant="outline" size="icon" onClick={() => handleCopy(activeCrypto.address)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-4 rounded-lg text-sm border border-amber-200 dark:border-amber-800">
                        <p className="font-semibold mb-1">Warning</p>
                        <p>Send only {activeCrypto.name} to this address. Sending other assets will result in permanent loss.</p>
                      </div>

                      <Button className="w-full" onClick={() => setShowConfirm(true)}>I've made my transfer</Button>
                    </>
                  ) : (
                    <form onSubmit={handleCryptoSubmit} className="space-y-4">
                      <h3 className="font-semibold text-lg mb-4">Confirm Transfer</h3>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Amount Sent ({activeCrypto.id})</label>
                        <Input placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Transaction Hash / TXID</label>
                        <Input placeholder="0x..." value={txHash} onChange={(e) => setTxHash(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Screenshot (Optional)</label>
                        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-secondary/50 transition-colors cursor-pointer">
                          <UploadCloud className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Click to upload screenshot</p>
                        </div>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" className="w-full" onClick={() => setShowConfirm(false)}>Back</Button>
                        <Button type="submit" className="w-full">Confirm Deposit</Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bank">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Wire Transfer Details
              </CardTitle>
              <CardDescription>Minimum deposit: $1,000</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-4 bg-secondary/30 p-6 rounded-lg border border-border/50">
                    {[
                      { label: 'Bank', value: 'Barclays Bank PLC' },
                      { label: 'Account Name', value: 'Landsec Capital Ltd' },
                      { label: 'Account Number', value: '20384756' },
                      { label: 'Sort Code', value: '20-41-63' },
                      { label: 'IBAN', value: 'GB29 BUKB 2041 6320 3847 56' },
                      { label: 'SWIFT/BIC', value: 'BUKBGB22' },
                      { label: 'Reference', value: user?.id || 'User ID' },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center border-b border-border/50 pb-2 last:border-0 last:pb-0">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium font-mono text-sm">{item.value}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(item.value)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-lg mb-4">Instructions</h3>
                    <ol className="space-y-4 list-decimal list-inside text-sm text-muted-foreground">
                      <li><strong className="text-foreground">Copy the bank details:</strong> Use the exact details provided. Ensure the Reference number is included so we can match the deposit to your account.</li>
                      <li><strong className="text-foreground">Initiate transfer:</strong> Log into your bank and initiate a wire transfer.</li>
                      <li><strong className="text-foreground">Send proof:</strong> Once completed, email your transfer receipt to deposits@landseccapital.com.</li>
                    </ol>
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <Button 
                      className="w-full" 
                      onClick={() => toast({ title: 'Next Steps', description: 'Please email your receipt to deposits@landseccapital.com' })}
                    >
                      <UploadCloud className="w-4 h-4 mr-2" />
                      Upload Transfer Receipt
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
