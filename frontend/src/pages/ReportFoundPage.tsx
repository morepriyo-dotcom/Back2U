import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Upload, Lock, Award, MapPin, Tag, CheckCircle2, Shield,
  Image as ImageIcon, Info, ChevronDown, ChevronUp, Calendar, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Mandatory fields: description, incident_date
// Optional: title (auto-derived), category, location_name, custody_status, private_clues, image_url
const foundSchema = z.object({
  description: z.string().min(8, 'Please provide an item description (at least 8 characters)'),
  incident_date: z.string().min(1, 'Date and approximate time found is mandatory'),
  title: z.string().optional(),
  category: z.string().optional(),
  location_name: z.string().optional(),
  custody_status: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  private_clues: z.string().optional(),
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
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FoundFormData>({
    resolver: zodResolver(foundSchema),
    defaultValues: {
      category: 'Electronics',
      custody_status: 'IN_POSSESSION',
      location_name: '',
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
        title: data.title?.trim() || undefined,
        category: data.category?.trim() || 'Other',
        location_name: data.location_name?.trim() || 'Location Not Specified',
        custody_status: data.custody_status || 'IN_POSSESSION',
        image_url: imageUrl || undefined,
      });
      await refreshUser();
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
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Found Item Logged Successfully
          </span>
          <h2 className="text-2xl font-bold text-white">Thank You for Assisting the Community</h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          Your report has been logged and background AI matching has scanned for lost items. When the verified owner claims this item and return is confirmed, you will be awarded <strong className="text-emerald-400">+150 Back2U Recovery Points</strong>!
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
          <span>Found Item Intimation</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Report a Found Item
        </h1>
        <p className="text-xs text-slate-400">
          Found an item? Report the basic description and date. Our system runs background AI matching to connect you with rightful owners.
        </p>
      </div>

      {/* Statutory Guidance */}
      <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3.5 text-xs text-slate-300">
        <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-emerald-300 block">Finder Rights & Responsibilities (Indian Contract Act, Sec 168):</strong>
          <p className="leading-relaxed text-slate-300">
            A finder of lost goods acts as a custodian with a duty of reasonable care. Upon documented, verified handover to the true owner, you earn <strong>+150 Back2U Recovery Points</strong> and an enhanced citizen Trust Score.
          </p>
        </div>
      </div>

      {/* Main Report Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="p-6 md:p-8 rounded-2xl bg-[#091224]/90 border border-blue-900/35 space-y-6"
      >
        {/* MANDATORY SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-blue-900/40">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Mandatory Information
            </h3>
            <span className="text-[11px] text-slate-400">Required fields</span>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Item Description *
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Describe the item generally (e.g. Set of car keys with a black fob, or silver metal water bottle found near bench)..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 transition-colors"
            />
            {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>}
          </div>

          {/* Incident Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Date & Time Found *
            </label>
            <input
              {...register('incident_date')}
              type="datetime-local"
              className="w-full px-4 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-sm text-white focus:outline-none focus:border-blue-400 transition-colors"
            />
            {errors.incident_date && <p className="text-xs text-red-400 mt-1">{errors.incident_date.message}</p>}
          </div>
        </div>

        {/* IMAGE UPLOAD (OPTIONAL BUT ENCOURAGED) */}
        <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <label className="text-xs font-bold text-white">
                Item Photo (Optional — Highly Encouraged)
              </label>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Assists Visual AI Match
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            A photo helps AI automatically match against owner reports. Do not expose confidential identifying numbers or private owner details in the photo.
          </p>

          <div className="flex items-center gap-4 pt-1">
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0E1A33] border border-blue-500/30 text-xs font-semibold text-blue-300 hover:text-white hover:border-blue-400 transition-all">
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Uploading...' : 'Choose Photo'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />
            </label>
            {imageUrl && (
              <div className="flex items-center gap-2">
                <img src={imageUrl} alt="Uploaded" className="w-10 h-10 rounded-lg object-cover border border-emerald-500/50" />
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Photo Attached
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ACCORDION / TOGGLE FOR OPTIONAL DETAILS */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
            className="w-full flex items-center justify-between py-2.5 px-4 rounded-xl bg-[#070D1A] border border-blue-900/40 text-xs font-semibold text-slate-300 hover:text-white transition-all"
          >
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-400" />
              Additional Details (Location, Category, Title, Custody, Secret Clues)
            </span>
            {showOptionalFields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showOptionalFields && (
            <div className="p-4 mt-3 rounded-xl bg-[#070D1A]/60 border border-blue-900/30 space-y-4">
              
              {/* Optional Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Custom Title (Optional)
                  </label>
                  <input
                    {...register('title')}
                    type="text"
                    placeholder="e.g. Set of Car Keys"
                    className="w-full px-3.5 py-2 rounded-lg bg-[#070D1A] border border-blue-900/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                  />
                  <span className="text-[10px] text-slate-500">Auto-derived if left empty</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category (Optional)
                  </label>
                  <select
                    {...register('category')}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#070D1A] border border-blue-900/50 text-xs text-white focus:outline-none focus:border-blue-400"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-[#091224]">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location & Custody */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    Found Location (Optional)
                  </label>
                  <input
                    {...register('location_name')}
                    type="text"
                    placeholder="e.g. Main Lobby near reception desk"
                    className="w-full px-3.5 py-2 rounded-lg bg-[#070D1A] border border-blue-900/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Custody Status (Optional)
                  </label>
                  <select
                    {...register('custody_status')}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#070D1A] border border-blue-900/50 text-xs text-white focus:outline-none focus:border-blue-400"
                  >
                    {CUSTODY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#091224]">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Brand & Model */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Brand (Optional)</label>
                  <input
                    {...register('brand')}
                    type="text"
                    placeholder="e.g. Sony / Honda"
                    className="w-full px-3 py-2 rounded-lg bg-[#070D1A] border border-blue-900/50 text-xs text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Model (Optional)</label>
                  <input
                    {...register('model')}
                    type="text"
                    placeholder="e.g. WH-1000XM4"
                    className="w-full px-3 py-2 rounded-lg bg-[#070D1A] border border-blue-900/50 text-xs text-white placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Private Challenge Details */}
              <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <label className="text-xs font-bold text-emerald-300">
                    Secret Verification Clues (Kept Confidential)
                  </label>
                </div>
                <p className="text-[10px] text-slate-400">
                  Secret details known only to the rightful owner (e.g. specific keychain text or wallpaper color).
                </p>
                <textarea
                  {...register('private_clues')}
                  rows={2}
                  placeholder="e.g. Has initials 'AP' written in small print, or contains student ID..."
                  className="w-full px-3 py-1.5 rounded-lg bg-[#070D1A] border border-blue-900/50 text-xs text-white placeholder-slate-500"
                />
              </div>

            </div>
          )}
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Shield className="w-4 h-4" />
            {submitting ? 'Registering Item...' : 'Submit Found Report (Background AI Matching Active)'}
          </button>
        </div>
      </form>
    </div>
  );
};
