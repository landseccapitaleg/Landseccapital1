import { useState, useEffect } from 'react';
import { ShieldCheck, Upload, CheckCircle2, Clock, AlertCircle, User, FileText, Camera, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type Step = 'personal' | 'identity' | 'address' | 'selfie' | 'done';

const steps: { id: Step; label: string; icon: typeof User }[] = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'identity', label: 'Identity Document', icon: FileText },
  { id: 'address', label: 'Proof of Address', icon: ShieldCheck },
  { id: 'selfie', label: 'Selfie Check', icon: Camera },
];

function UploadBox({ label, hint, onUpload, uploaded }: { label: string; hint: string; onUpload: (file: File) => void; uploaded: boolean }) {
  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
        uploaded
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-secondary/30'
      }`}
    >
      <input type="file" accept="image/*,.pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => { const file = e.target.files?.[0]; if (file) onUpload(file); }} />
      {uploaded ? (
        <div className="space-y-2">
          <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
          <p className="text-sm font-semibold text-primary">Uploaded successfully</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Upload className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      )}
    </div>
  );
}

export default function KYC() {
  const { toast } = useToast();
  const [kycStatus, setKycStatus] = useState('pending');
  const [currentStep, setCurrentStep] = useState<Step>('personal');
  const [uploads, setUploads] = useState<Record<string, boolean>>({});
  const [files, setFiles] = useState<Record<string, File>>({});

  const [personal, setPersonal] = useState({ dob: '', nationality: '', phone: '' });
  const [idType, setIdType] = useState('');

  const stepIndex = steps.findIndex((s) => s.id === currentStep);
  const isDone = currentStep === 'done';

  useEffect(() => {
    fetch('/api/user/kyc', { credentials: 'include' }).then(r => r.ok ? r.json() : {}).then((d: any) => setKycStatus(d.kyc?.[0]?.status || 'pending')).catch(() => {});
  }, []);
  const handleUpload = (key: string, file: File) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
    setUploads((prev) => ({ ...prev, [key]: true }));
    toast({ title: 'File received', description: 'Document uploaded successfully.' });
  };

  const goNext = async () => {
    const order: Step[] = ['personal', 'identity', 'address', 'selfie', 'done'];
    const idx = order.indexOf(currentStep);
    if (currentStep === 'selfie') {
      const response = await fetch('/api/user/kyc', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dob: personal.dob, nationality: personal.nationality, phone: personal.phone, documentType: idType, documents: { idFront: files['id-front']?.name, idBack: files['id-back']?.name || files['id-front']?.name, address: files.address?.name, selfie: files.selfie?.name } }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { toast({ title: 'Submission failed', description: result.error || 'Please try again.', variant: 'destructive' }); return; }
      setKycStatus(result.user?.kycStatus || 'pending'); setCurrentStep('done'); return;
    }
    if (idx < order.length - 1) setCurrentStep(order[idx + 1]);
  };

  const canProceed = () => {
    if (currentStep === 'personal') return personal.dob && personal.nationality && personal.phone;
    if (currentStep === 'identity') return idType && uploads['id-front'];
    if (currentStep === 'address') return uploads['address'];
    if (currentStep === 'selfie') return uploads['selfie'];
    return false;
  };

  if (isDone) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-10 h-10 text-primary" />
        </div>
        <h1 className="font-serif text-3xl font-bold">Verification {kycStatus === 'rejected' ? 'Rejected' : 'Submitted'}</h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
           {kycStatus === 'rejected' ? 'Your submission was rejected. Please review the requirements and resubmit.' : 'Your documents have been submitted and are pending review.'}
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge className="bg-primary/15 text-primary border-primary/20 px-4 py-1.5 text-sm">
             {kycStatus === 'rejected' ? <AlertCircle className="w-4 h-4 mr-1.5" /> : <Clock className="w-4 h-4 mr-1.5" />} {kycStatus === 'rejected' ? 'Rejected' : 'Pending Review'}
          </Badge>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 pt-4 text-left">
          {[
            { icon: ShieldCheck, label: 'Identity Verified', desc: 'Government ID confirmed' },
            { icon: FileText, label: 'Address Confirmed', desc: 'Proof of residence on file' },
            { icon: CheckCircle2, label: 'Account Active', desc: 'Full investment access unlocked' },
          ].map(({ icon: Icon, label, desc }, i) => (
            <div key={i} className="p-4 rounded-xl border border-border/50 bg-card">
              <Icon className="w-5 h-5 text-primary mb-2" />
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold">Identity Verification (KYC)</h1>
        <p className="text-muted-foreground mt-1">Complete verification to unlock full investment access.</p>
      </div>

      {/* Status banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
        <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold">Verification Pending</p>
          <p className="text-amber-400/80">Complete all steps below to verify your account instantly.</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {steps.map(({ id, label, icon: Icon }, i) => {
          const done = stepIndex > i;
          const active = currentStep === id;
          return (
            <div key={id} className="flex items-center gap-2 flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                  done ? 'bg-primary border-primary text-primary-foreground' :
                  active ? 'border-primary text-primary bg-primary/10' :
                  'border-border text-muted-foreground'
                }`}>
                  {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-xs mt-1.5 font-medium text-center leading-tight ${active ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-px flex-1 mb-5 transition-colors ${done ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card className="border-border/50">
        {currentStep === 'personal' && (
          <>
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Tell us a bit more about yourself.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" value={personal.dob} onChange={(e) => setPersonal({ ...personal, dob: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input type="tel" value={personal.phone} onChange={(e) => setPersonal({ ...personal, phone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nationality</Label>
                <Select value={personal.nationality} onValueChange={(v) => setPersonal({ ...personal, nationality: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    {['British', 'American', 'Canadian', 'Australian', 'German', 'French', 'Nigerian', 'South African', 'Indian', 'Other'].map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </>
        )}

        {currentStep === 'identity' && (
          <>
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <CardTitle>Identity Document</CardTitle>
                  <CardDescription>Upload a government-issued photo ID.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select value={idType} onValueChange={setIdType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="driving">Driving Licence</SelectItem>
                    <SelectItem value="national">National ID Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <UploadBox
                  label="Front of Document"
                  hint="JPG, PNG or PDF — max 10MB"
                   onUpload={(file) => handleUpload('id-front', file)}
                  uploaded={!!uploads['id-front']}
                />
                <UploadBox
                  label="Back of Document"
                  hint="Not required for passports"
                   onUpload={(file) => handleUpload('id-back', file)}
                  uploaded={!!uploads['id-back']}
                />
              </div>
            </CardContent>
          </>
        )}

        {currentStep === 'address' && (
          <>
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <CardTitle>Proof of Address</CardTitle>
                  <CardDescription>Upload a document showing your current address, dated within the last 3 months.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
                {['Bank Statement', 'Utility Bill', 'Council Tax', 'Tenancy Agreement'].map((t) => (
                  <div key={t} className="text-center p-3 rounded-lg border border-border/50 bg-secondary/20 text-xs font-medium text-muted-foreground">
                    {t}
                  </div>
                ))}
              </div>
              <UploadBox
                label="Upload Proof of Address"
                hint="JPG, PNG or PDF — max 10MB — dated within 3 months"
                 onUpload={(file) => handleUpload('address', file)}
                uploaded={!!uploads['address']}
              />
            </CardContent>
          </>
        )}

        {currentStep === 'selfie' && (
          <>
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Camera className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <CardTitle>Selfie Verification</CardTitle>
                  <CardDescription>Take a clear selfie to confirm your identity matches your ID.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="bg-secondary/30 rounded-xl p-5 space-y-3 border border-border/50">
                <p className="text-sm font-semibold text-foreground">Tips for a good selfie:</p>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {[
                    'Face the camera directly in good lighting',
                    'Remove hats, sunglasses, or face coverings',
                    'Ensure your full face is clearly visible',
                    'Hold your ID document next to your face if possible',
                  ].map((tip, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
              <UploadBox
                label="Upload Selfie Photo"
                hint="JPG or PNG — max 10MB — clear, well-lit face photo"
                 onUpload={(file) => handleUpload('selfie', file)}
                uploaded={!!uploads['selfie']}
              />
            </CardContent>
          </>
        )}

        {/* Footer nav */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-secondary/10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-primary" />
            All documents are encrypted and stored securely
          </div>
          <Button onClick={goNext} disabled={!canProceed()} className="gap-2">
            {currentStep === 'selfie' ? 'Submit Verification' : 'Continue'}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Security note */}
      <div className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card text-sm text-muted-foreground">
        <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p>Your personal information is protected under GDPR. We use it only to verify your identity in compliance with UK anti-money laundering regulations.</p>
      </div>
    </div>
  );
}
