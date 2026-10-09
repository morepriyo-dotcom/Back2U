import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Upload, Lock, Sparkles, MapPin, Tag, CheckCircle2, 
  ShieldAlert, FileText, AlertTriangle, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const lostSchema = z.object({
  title: z.string().min(3, 'Item title must be at least 3 characters'),
  category: z.string().min(1, 'Please select a category'),
  description: z.string().min(10, 'Please provide a detailed description (at least 10 characters)'),
  location_name: z.string().min(2, 'Please specify the approximate location'),
  incident_date: z.string().min(1, 'Date and approximate time is required'),
  brand: z.string().optional(),
  model: z.string().optional(),
  private_clues: z.string().optional(),
  is_govt_id: z.boolean().optional(),
  govt_id_type: z.string().optional(),
  masked_identifier: z.string().optional(),
});

type LostFormData = z.infer<typeof lostSchema>;

const CATEGORIES = [
  'Electronics',
  'Wallets and bags',
  'Keys',
  'Documents',
  'Clothing',
  'Accessories',
  'Bottles and containers',
  'Other',
];

const GOVT_ID_TYPES = [
  'Aadhaar Card',
  'Permanent Account Number (PAN)',
  'Passport',
  'Driving License',
  'Voter Identity Card',
  'University / College Student ID',
  'Employee ID Card'
];

export const ReportLostPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedItem, setSubmittedItem] = useState<any | null>(null);

  const [isGovtDoc, setIsGovtDoc] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LostFormData>({
    resolver: zodResolver(lostSchema),
    defaultValues: {
      category: 'Electronics',
      incident_date: new Date().toISOString().slice(0, 16),
      is_govt_id: false,
      govt_id_type: 'Aadhaar Card'
    },
  });

  const selectedCategory = watch('category');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await api.uploadFile(file);
      setImageUrl(res.url);
    } catch (err: any) {
      alert(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: LostFormData) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      const created = await api.createItem({
        ...data,
        report_type: 'LOST',
        image_url: imageUrl || undefined,
        custody_status: 'IN_POSSESSION',
        is_govt_id: isGovtDoc,
      });
      setSubmittedItem(created);
    } catch (err: any) {
      alert(err.message || 'Failed to submit lost report');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedItem) {
    return (
      <div className="relative z-10 max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
            Digital Lost Article Reference Generated
          </span>
          <h2 className="text-2xl font-black text-white">Lost Report Registered Successfully</h2>
          <div className="inline-block p-3 rounded-xl bg-blue-950/60 border border-blue-500/40 font-mono text-sm font-bold text-sky-300">
            LR Reference: {submittedItem.lr_number || `B2U-LR-2026-${submittedItem.id}`}
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
          Our multi-modal AI has generated high-dimensional semantic and visual embeddings for your item. Your official Digital LR Reference can be used to track recovery or present to authorities.
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            onClick={() => navigate(`/items/${submittedItem.id}`)}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            View Report & AI Matches
          </button>
          <button
            onClick={() => navigate('/my-reports')}
            className="px-6 py-2.5 rounded-full text-xs font-semibold text-slate-300 bg-[#0E1A33] border border-blue-500/30 hover:text-white transition-all"
          >
            My Reports
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
          <Tag className="w-4 h-4" />
          <span>Citizen Lost Property Intimation</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Report a Lost Belonging
        </h1>
        <p className="text-xs text-slate-400">
          Provide accurate details to enable AI matching and challenge verification. Confidential clues are encrypted to safeguard rightful ownership.
        </p>
      </div>

      {/* Statutory Legal Guidance Notice (Compliant with Police Guidelines) */}
      <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 flex items-start gap-3.5 text-xs text-slate-300">
        <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-blue-300 block">Notice regarding Lost Property vs. Criminal Theft:</strong>
          <p className="leading-relaxed text-slate-300">
            This report generates an official <strong>Digital Lost Article Reference (LR Number)</strong> for civil recovery and duplicate issuance (compliant with Delhi & State Police citizen standards and Section 168/169 of the Indian Contract Act). If your item was snatched, extorted, or stolen in a crime, please also file an official <strong>e-FIR</strong> at your nearest police station.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="p-6 md:p-8 rounded-2xl bg-[#091224]/90 border border-blue-900/35 space-y-6"
      >
        {/* Basic Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Item Name / Title *
            </label>
            <input
              {...register('title')}
              type="text"
              placeholder="e.g. Black Leather Bifold Wallet"
              className="w-full px-4 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 transition-colors"
            />
            {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Category *
            </label>
            <select
              {...register('category')}
              onChange={(e) => {
                setValue('category', e.target.value);
                if (e.target.value === 'Documents') setIsGovtDoc(true);
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-sm text-white focus:outline-none focus:border-blue-400 transition-colors"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-[#091224]">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Government Identity Card / Document Protection Toggle */}
        <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isGovtDoc}
              onChange={(e) => setIsGovtDoc(e.target.checked)}
              className="rounded bg-[#070D1A] border-purple-800 text-purple-600 focus:ring-0"
            />
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              This is a Government Identity Card, Student ID, or Legal Document
            </span>
          </label>

          {isGovtDoc && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Document Type</label>
                <select
                  {...register('govt_id_type')}
                  className="w-full px-3 py-2 rounded-lg bg-[#070D1A] border border-purple-900/50 text-white"
                >
                  {GOVT_ID_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-[#091224]">{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Card / Document Number (Auto-Masked)
                </label>
                <input
                  {...register('masked_identifier')}
                  type="text"
                  placeholder="e.g. 5492 8192 1042 or ABCDE1234F"
                  className="w-full px-3 py-2 rounded-lg bg-[#070D1A] border border-purple-900/50 text-white placeholder-slate-500 font-mono"
                />
                <span className="text-[10px] text-purple-300 mt-1 block">
                  Numbers are automatically masked (e.g. XXXX-XXXX-1042) to strictly protect identity.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Location & Time Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Lost Location (Campus Area / Building / Landmark) *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                {...register('location_name')}
                type="text"
                placeholder="e.g. Central Library 2nd Floor"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 transition-colors"
              />
            </div>
            {errors.location_name && <p className="text-xs text-red-400 mt-1">{errors.location_name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Approximate Date & Time Lost *
            </label>
            <input
              {...register('incident_date')}
              type="datetime-local"
              className="w-full px-4 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-sm text-white focus:outline-none focus:border-blue-400 transition-colors"
            />
            {errors.incident_date && <p className="text-xs text-red-400 mt-1">{errors.incident_date.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Brand (Optional)
              </label>
              <input
                {...register('brand')}
                type="text"
                placeholder="e.g. Apple"
                className="w-full px-3 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Model (Optional)
              </label>
              <input
                {...register('model')}
                type="text"
                placeholder="e.g. Pro 2"
                className="w-full px-3 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
        </div>

        {/* Public Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-1.5">
            Public Description *
          </label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Describe the item's general appearance, color, size, and circumstances of loss..."
            className="w-full px-4 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 transition-colors"
          />
          {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>}
        </div>

        {/* Confidential Identifying Details (Privacy Boundary Rule) */}
        <div className="p-4 rounded-xl bg-blue-950/25 border border-blue-500/25 space-y-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-400" />
            <label className="text-xs font-bold text-blue-300 uppercase tracking-wider">
              Private Distinguishing Clues (Confidential to You)
            </label>
          </div>
          <p className="text-[11px] text-slate-400">
            Never displayed publicly or in search results. Used exclusively to challenge prospective finders and verify ownership before handover.
          </p>
          <textarea
            {...register('private_clues')}
            rows={2}
            placeholder="e.g. Tiny scrape on the left hinge, or initials 'RM' written in black marker..."
            className="w-full px-3.5 py-2 rounded-lg bg-[#070D1A] border border-blue-900/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
          />
        </div>

        {/* Photograph Upload */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-1.5">
            Reference Photograph (Optional)
          </label>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0E1A33] border border-blue-500/30 text-xs font-semibold text-blue-300 hover:text-white hover:border-blue-400 transition-all">
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />
            </label>
            {imageUrl && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Image uploaded successfully
              </span>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? 'Registering Report...' : 'Submit Lost Report & Generate Digital LR Reference'}
          </button>
        </div>
      </form>

    </div>
  );
};
