import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface AdminUser { email: string; name: string; role: 'super' | 'admin'; }
export interface PendingDeposit { id: string; userName: string; userEmail: string; amount: number; method: string; txRef: string; date: string; status: 'pending' | 'approved' | 'rejected'; }
export interface PendingWithdrawal { id: string; userName: string; userEmail: string; amount: number; destination: string; date: string; status: 'pending' | 'approved' | 'rejected'; }
export interface PendingKYC { id: string; userName: string; userEmail: string; docType: string; submittedDate: string; status: 'pending' | 'approved' | 'rejected'; }
export interface PaymentDetails { btcAddress: string; ethAddress: string; usdtAddress: string; usdcAddress: string; bankName: string; accountName: string; accountNumber: string; sortCode: string; reference: string; }
export interface HomepageContent { heroTitle: string; heroSubtitle: string; heroCta: string; aum: string; investors: string; avgReturn: string; since: string; }
export interface AdminInvestor { id: string; name: string; email: string; plan: string; investedAmount: number; joinDate: string; kycStatus: string; }

interface AdminContextType {
  admin: AdminUser | null; isAdminAuthenticated: boolean; isAdminLoading: boolean;
  adminLogin: (email: string, pass: string) => Promise<boolean>; adminLogout: () => void;
  deposits: PendingDeposit[]; withdrawals: PendingWithdrawal[]; kycRequests: PendingKYC[]; users: AdminInvestor[];
  approveDeposit: (id: string) => Promise<void>; rejectDeposit: (id: string) => Promise<void>;
  approveWithdrawal: (id: string) => Promise<void>; rejectWithdrawal: (id: string) => Promise<void>;
  approveKYC: (id: string) => Promise<void>; rejectKYC: (id: string, reason: string) => Promise<void>;
  admins: AdminUser[]; addAdmin: (email: string, name: string) => Promise<void>;
  changeAdminPassword: (newPass: string) => Promise<boolean>;
  paymentDetails: PaymentDetails; updatePaymentDetails: (d: PaymentDetails) => Promise<void>;
  homepageContent: HomepageContent; updateHomepageContent: (c: HomepageContent) => Promise<void>;
}
const emptyPayment = {} as PaymentDetails;
const emptyHomepage = {} as HomepageContent;
const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [data, setData] = useState<any>({});
  const refresh = useCallback(async () => {
    const r = await fetch('/api/admin/operations', { credentials: 'include' });
    if (!r.ok) throw new Error('Unable to load operations');
    setData(await r.json());
  }, []);
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/session', { credentials: 'include' }).then(r => r.ok ? r.json() : null),
      fetch('/api/admin/operations', { credentials: 'include' }).then(r => r.ok ? r.json() : {}),
    ]).then(([session, operations]) => { if (session?.admin) setAdmin(session.admin); setData(operations || {}); })
      .catch(() => {}).finally(() => setIsAdminLoading(false));
  }, []);
  const action = useCallback(async (type: string, id?: string, extra: Record<string, unknown> = {}) => {
    const r = await fetch('/api/admin/operations', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: type, id, ...extra }) });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Operation failed');
    await refresh();
  }, [refresh]);
  const adminLogin = async (email: string, password: string) => { try { const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email, password }) }); const d = await r.json(); if (!r.ok || !d.admin) return false; setAdmin(d.admin); await refresh().catch(() => {}); return true; } catch { return false; } };
  const adminLogout = () => { void fetch('/api/admin/logout', { method: 'POST', credentials: 'include' }); setAdmin(null); };
  const list = (key: string) => data[key] || data.operations?.[key] || [];
  const deposits = list('deposits').map((d: any) => ({ ...d, amount: Number(d.amount || 0), txRef: d.txRef || d.reference || '', date: d.date || d.createdAt || '' }));
  const withdrawals = list('withdrawals').map((w: any) => ({ ...w, amount: Number(w.amount || 0), date: w.date || w.createdAt || '' }));
  const kycRequests = (data.kycRequests || data.kyc || data.operations?.kycRequests || data.operations?.kyc || []).map((k: any) => ({ ...k, docType: k.docType || k.documentType || '', submittedDate: k.submittedDate || k.createdAt || '' }));
  const users = list('users').map((u: any) => ({ ...u, investedAmount: Number(u.investedAmount || 0), joinDate: u.joinDate || u.createdAt || '', kycStatus: u.kycStatus || kycRequests.find((k: any) => k.userId === u.id)?.status || 'pending' }));
  return <AdminContext.Provider value={{
    admin, isAdminAuthenticated: !!admin, isAdminLoading, adminLogin, adminLogout,
    deposits, withdrawals, kycRequests, users,
    approveDeposit: id => action('deposit.approve', id), rejectDeposit: id => action('deposit.reject', id),
    approveWithdrawal: id => action('withdrawal.approve', id), rejectWithdrawal: id => action('withdrawal.reject', id),
    approveKYC: id => action('kyc.approve', id), rejectKYC: (id, reason) => action('kyc.reject', id, { reason }),
    admins: list('admins'), addAdmin: async () => { throw new Error('Adding administrators is not supported by the operations API'); },
    changeAdminPassword: async password => (await fetch('/api/admin/password', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })).ok,
    paymentDetails: data.paymentDetails || emptyPayment, updatePaymentDetails: d => action('settings.payment', undefined, { data: d }),
    homepageContent: data.homepageContent || emptyHomepage, updateHomepageContent: c => action('settings.homepage', undefined, { data: c }),
  }}>{children}</AdminContext.Provider>;
}
export function useAdmin() { const ctx = useContext(AdminContext); if (!ctx) throw new Error('useAdmin must be used within AdminProvider'); return ctx; }