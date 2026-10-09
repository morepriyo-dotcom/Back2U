import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, Lock, Award, MapPin, Tag, CheckCircle2, Shield } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const foundSchema = z.object({
  title: z.string().min(3, 'Item title must be at least 3 characters'),
  category: z.string().min(1, 'Please select a category'),
  description: z.string().min(10, 'Please provide a detailed description (at least 10 characters)'),
  location_name: z.string().min(2, 'Please specify the approximate location'),
  incident_date: z.string().min(1, 'Date and approximate time found is required'),
  brand: z.string().optional(),
  model: z.string().optional(),
  private_clues: z.string().min(5, 'Please provide at least one secret clue to verify the rightful owner'),
  custody_status: z.string().min(1, 'Please specify current custody status'),
});

type FoundFormData = z.infer<typeof foundSchema>;

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

const CUSTODY_OPTIONS = [
  { value: 'IN_POSSESSION', label: 'In my personal possession' },
  { value: 'SECURITY_DESK', label: 'Handed to Security Desk' },
  { value: 'CAMPUS_OFFICE', label: 'Turned into Campus/Building Office' },
  { value: 'POLICE', label: 'Turned into Local Authorities / Police' },
  { value: 'SMART_LOCKER', label: 'Stored in Back2U Smart Locker' },
];

export const ReportFoundPage: React.FC = () => {
  const { isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedItemId, setSubmittedItemId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FoundFormData>({
    resolver: zodResolver(foundSchema),
    defaultValues: {
      category: 'Electronics',
      custody_status: 'IN_POSSESSION',
      incident_date: new Date().toISOString().slice(0, 16),
    },
  });

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

  const onSubmit = async (data: FoundFormData) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      const created = await api.createItem({
        ...data,
        report_type: 'FOUND',
        image_url: imageUrl || undefined,
      });
      await refreshUser(); // Refresh +50 points
      setSubmittedItemId(created.id);
    } catch (err: any) {
      alert(err.message || 'Failed to submit found item report');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedItemId) {
    return (
      <div className="relative z-10 max-w-xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-yellow-400">
            +50 Back2U Points Earned!
          </span>
          <h2 className="text-2xl font-bold text-white">Thank You for Being a Good Samaritan</h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          Your report has been logged. When the owner submits a claim or AI detects a match, you will be notified to review their challenge answers.
        </p>
        <div className="flex justify-center gap-3 pt-4">
          <button
            onClick={() => navigate(`/items/${submittedItemId}`)}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
          >
            View Listing
          </button>
          <button
            onClick={() => navigate('/rewards')}
            className="px-6 py-2.5 rounded-full text-xs font-semibold text-slate-300 bg-[#0E1A33] border border-blue-500/30 hover:text-white"
          >
            Check Points Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
          <Award className="w-4 h-4" />
          <span>Report a Found Item (+50 Points)</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Help Bring It Home
        </h1>
        <p className="text-xs text-slate-400">
          Found something? Register the item securely. You earn 50 Back2U Points immediately, plus 150 points upon successful return to the verified owner.
        </p>
      </div>

      {/* Statutory Finder Declaration (Indian Contract Act Sec 168/169) */}
      <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3.5 text-xs text-slate-300">
        <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-emerald-300 block">Finder Rights & Responsibilities (Indian Contract Act, 1872):</strong>
          <p className="leading-relaxed text-slate-300">
            Under Section 71 and Section 168 of the Indian Contract Act, a finder of lost goods is treated as a <em>quasi-bailee</em> with a legal duty of reasonable care. You possess the right of retention until lawful expenses or promised rewards (+150 Back2U Points) are reimbursed upon true owner verification.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="p-6 md:p-8 rounded-2xl bg-[#091224]/90 border border-blue-900/35 space-y-6"
      >
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-1.5">
            Item Title *
          </label>
          <input
            {...register('title')}
            type="text"
            placeholder="e.g. Dark Men's Leather Wallet found on bench"
            className="w-full px-4 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 transition-colors"
          />
          {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>}
        </div>

        {/* Category & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Category *
            </label>
            <select
              {...register('category')}
              className="w-full px-4 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-sm text-white focus:outline-none focus:border-blue-400 transition-colors"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-red-400 mt-1">{errors.category.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Found Location *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                {...register('location_name')}
                type="text"
                placeholder="e.g. Main Building ground floor bench"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 transition-colors"
              />
            </div>
            {errors.location_name && <p className="text-xs text-red-400 mt-1">{errors.location_name.message}</p>}
          </div>
        </div>

        {/* Date Found & Custody Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Date & Time Found *
            </label>
            <input
              {...register('incident_date')}
              type="datetime-local"
              className="w-full px-4 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-sm text-white focus:outline-none focus:border-blue-400 transition-colors"
            />
            {errors.incident_date && <p className="text-xs text-red-400 mt-1">{errors.incident_date.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Current Custody Status *
            </label>
            <select
              {...register('custody_status')}
              className="w-full px-4 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-sm text-white focus:outline-none focus:border-blue-400 transition-colors"
            >
              {CUSTODY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Brand & Model */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Brand / Manufacturer (if known)
            </label>
            <input
              {...register('brand')}
              type="text"
              placeholder="e.g. Bellroy"
              className="w-full px-4 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Model (if known)
            </label>
            <input
              {...register('model')}
              type="text"
              placeholder="e.g. Slim Sleeve"
              className="w-full px-4 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>

        {/* Public Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-1.5">
            Public Safe Description *
          </label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Describe the item generally without revealing secret details that only the true owner would know..."
            className="w-full px-4 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 transition-colors"
          />
          {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>}
        </div>

        {/* Private Distinguishing Details for Challenge Response */}
        <div className="p-4 rounded-xl bg-blue-950/25 border border-blue-500/25 space-y-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <label className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              Secret Ownership Challenge Clues (Kept Confidential) *
            </label>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Specify 1 or 2 specific distinguishing details that only the genuine owner will be able to answer (e.g. "What color sticker is on the back?", "What name is inside the ID card slot?", "What key brand is attached?").
          </p>
          <textarea
            {...register('private_clues')}
            rows={2}
            placeholder="e.g. Contains student ID for Vikram Mehta, and a folded $20 bill in the secret flap..."
            className="w-full px-3.5 py-2 rounded-lg bg-[#070D1A] border border-blue-900/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
          />
          {errors.private_clues && <p className="text-xs text-red-400 mt-1">{errors.private_clues.message}</p>}
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-1.5">
            Item Photograph (Recommended for AI matching)
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
              <div className="flex items-center gap-3">
                <img
                  src={imageUrl}
                  alt="Uploaded preview"
                  className="w-12 h-12 rounded-lg object-cover border border-blue-500/30"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Shield className="w-4 h-4" />
            {submitting ? 'Registering item & generating AI embeddings...' : 'Submit Found Report (+50 Points)'}
          </button>
        </div>

      </form>

    </div>
  );
};
