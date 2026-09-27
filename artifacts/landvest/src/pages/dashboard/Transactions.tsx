import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Download, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Transactions() {
  const [filter, setFilter] = useState<'All' | 'Credit' | 'Debit'>('All');
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/user/dashboard', { credentials: 'include' }).then(r => r.ok ? r.json() : {}).then((d: any) => setTransactions(d.transactions || [])).catch(() => {});
  }, []);

  const filteredTransactions = transactions.map(t => ({ id: t.id, date: t.date || t.createdAt, desc: t.description || t.desc || t.type, type: String(t.type || '').toLowerCase().includes('withdraw') ? 'Debit' : 'Credit', amount: Number(t.amount || 0), status: t.status || 'Pending' })).filter(t => {
    const matchesFilter = filter === 'All' || t.type === filter;
    const matchesSearch = t.desc.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Statement downloading as PDF...'
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Transaction History</h1>
          <p className="text-muted-foreground mt-1">View and download your investment activity and dividend payments.</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="bg-white"><Download className="w-4 h-4 mr-2" /> Export Statement</Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex gap-2">
              {(['All', 'Credit', 'Debit'] as const).map(f => (
                <Button 
                  key={f} 
                  variant={filter === f ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilter(f)}
                  className={filter === f ? '' : 'bg-background'}
                >
                  {f}
                </Button>
              ))}
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search transactions..." 
                className="pl-9 bg-background" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-secondary/50">
                <TableRow>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((trx) => (
                    <TableRow key={trx.id}>
                      <TableCell className="font-medium text-muted-foreground">{trx.date}</TableCell>
                      <TableCell className="font-semibold">{trx.desc}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{trx.id}</TableCell>
                      <TableCell className={`text-right font-bold ${trx.type === 'Credit' ? 'text-green-600' : 'text-foreground'}`}>
                        {trx.type === 'Credit' ? '+' : '-'}${trx.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={
                          trx.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : 
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }>
                          {trx.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No transactions found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}