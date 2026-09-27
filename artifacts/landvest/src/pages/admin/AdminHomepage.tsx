import { useEffect, useState } from 'react';
import { Globe, Save, CheckCircle2, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAdmin } from '@/context/AdminContext';
import { useToast } from '@/hooks/use-toast';

type HomepageContent = {
  heroTitle: string;
  heroSubtitle: string;
  heroCta: string;
  aum: string;
  investors: string;
  avgReturn: string;
  since: string;
};

export default function AdminHomepage() {
  const { homepageContent, updateHomepageContent } = useAdmin();
  const { toast } = useToast();
  const [form, setForm] = useState<HomepageContent>(homepageContent);
  const [saved, setSaved] = useState(false);

  useEffect(() => setForm(homepageContent), [homepageContent]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSave = async () => {
    try {
      await updateHomepageContent(form);
      setSaved(true);
      toast({ title: 'Homepage Updated', description: 'Homepage content saved and will reflect on the public site.' });
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      toast({ title: 'Unable to save homepage content', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Homepage Editor</h1>
        <p className="text-slate-400 text-sm mt-1">Edit the public-facing homepage content live.</p>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white text-base">Hero Section</CardTitle>
          <CardDescription className="text-slate-400">The main headline and call-to-action shown above the fold.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-slate-300">Hero Title</Label>
            <Textarea value={form.heroTitle} onChange={set('heroTitle')} rows={3}
              className="bg-slate-700 border-slate-600 text-white resize-none" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Hero Subtitle</Label>
            <Textarea value={form.heroSubtitle} onChange={set('heroSubtitle')} rows={3}
              className="bg-slate-700 border-slate-600 text-white resize-none" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">CTA Button Text</Label>
            <Input value={form.heroCta} onChange={set('heroCta')} className="bg-slate-700 border-slate-600 text-white" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white text-base">Key Stats</CardTitle>
          <CardDescription className="text-slate-400">Figures shown in the trust-building stats bar.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 grid sm:grid-cols-2 gap-5">
          {[
            { key: 'aum', label: 'Assets Under Management (AUM)' },
            { key: 'investors', label: 'Total Investors' },
            { key: 'avgReturn', label: 'Average Annual Return' },
            { key: 'since', label: 'Operating Since (Year)' },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-slate-300 text-sm">{label}</Label>
              <Input value={form[key as keyof typeof form]} onChange={set(key as keyof typeof form)}
                className="bg-slate-700 border-slate-600 text-white" />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 flex-1 sm:flex-none sm:px-8">
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </Button>
        <Button variant="outline" onClick={() => window.open('/', '_blank')} className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-2">
          <Eye className="w-4 h-4" /> Preview Site
        </Button>
      </div>
    </div>
  );
}
