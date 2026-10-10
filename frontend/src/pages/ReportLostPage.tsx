import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Upload, Lock, Sparkles, MapPin, Tag, CheckCircle2, 
  ShieldAlert, ShieldCheck, Info, ChevronDown, ChevronUp, Image as ImageIcon,
  Calendar, HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Mandatory fields: description, incident_date
// Optional: title (auto-derived), category, location_name, image_url, etc.
const lostSchema = z.object({
  description: z.string().min(8, 'Please provide an item description (at least 8 characters)'),
  incident_date: z.string().min(1, 'Date when item was lost is mandatory'),
  title: z.string().optional(),
  category: z.string().optional(),
  location_name: z.string().optional(),
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
  const [showOptionalFields, setShowOptionalFields] = useState(false);
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
      location_name: '',
      incident_date: new Date().toISOString().slice(0, 16),
      is_govt_id: false,
      govt_id_type: 'Aadhaar Card'
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
        title: data.title?.trim() || undefined,
        category: data.category?.trim() || 'Other',
        location_name: data.location_name?.trim() || 'Location Not Specified',
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
          Automatic background AI matching has scanned newly found items. If a match score exceeds 50%, you will receive an instant notification in your Back2U inbox!
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            onClick={() => navigate(`/items/${submittedItem.id}`)}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            View Report & Matches
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
      
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
          <Tag className="w-4 h-4" />
          <span>Report Lost Property</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          What did you lose?
        </h1>
        <p className="text-xs text-slate-400">
          Fill in the required information. Automatic AI matching runs in the background and notifies you when potential matches are found.
        </p>
      </div>

      {/* Statutory Guidance */}
      <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 flex items-start gap-3.5 text-xs text-slate-300">
        <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-blue-300 block">Civil Lost Property Intimation:</strong>
          <p className="leading-relaxed text-slate-300">
            This generates an official <strong>Digital Lost Article Reference (LR Number)</strong> compliant with citizen intimation standards. If your item was snatched or stolen, please also file an official <strong>e-FIR</strong> at your local police station.
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
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              Mandatory Information
            </h3>
            <span className="text-[11px] text-slate-400">Required to register report</span>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Item Description *
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Describe the lost item clearly (e.g. Blue Dell Inspiron 15 laptop with a NASA sticker on the lid, or Black leather wallet)..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 transition-colors"
            />
            {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>}
          </div>

          {/* Incident Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              Date & Time Lost *
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
              <ImageIcon className="w-4 h-4 text-blue-400" />
              <label className="text-xs font-bold text-white">
                Item Photo (Optional — Highly Encouraged)
              </label>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Boosts AI Match Quality +40%
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            A reference photo enables OpenCLIP multi-modal visual embedding for automated background matching against found items.
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
                  Image Attached
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
              <Info className="w-4 h-4 text-blue-400" />
              Additional Details (Location, Category, Title, Clues)
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
                    placeholder="e.g. Dell Inspiron 15 Laptop"
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
                    onChange={(e) => {
                      setValue('category', e.target.value);
                      if (e.target.value === 'Documents') setIsGovtDoc(true);
                    }}
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

              {/* Optional Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  Approximate Lost Location (Optional)
                </label>
                <input
                  {...register('location_name')}
                  type="text"
                  placeholder="e.g. Central Library 2nd Floor, Terminal 3 Gate 14"
                  className="w-full px-3.5 py-2 rounded-lg bg-[#070D1A] border border-blue-900/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* Optional Brand & Model */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Brand (Optional)</label>
                  <input
                    {...register('brand')}
                    type="text"
                    placeholder="e.g. Apple / Dell"
                    className="w-full px-3 py-2 rounded-lg bg-[#070D1A] border border-blue-900/50 text-xs text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Model (Optional)</label>
                  <input
                    {...register('model')}
                    type="text"
                    placeholder="e.g. XPS 13"
                    className="w-full px-3 py-2 rounded-lg bg-[#070D1A] border border-blue-900/50 text-xs text-white placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Private Secret Clues */}
              <div className="p-3.5 rounded-lg bg-blue-950/30 border border-blue-500/20 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  <label className="text-xs font-bold text-blue-300">
                    Private Clues (Kept Confidential)
                  </label>
                </div>
                <p className="text-[10px] text-slate-400">
                  Hidden from public listings. Only used to verify finders during recovery.
                </p>
                <textarea
                  {...register('private_clues')}
                  rows={2}
                  placeholder="e.g. Small scratch on right corner, or red lanyard attached..."
                  className="w-full px-3 py-1.5 rounded-lg bg-[#070D1A] border border-blue-900/50 text-xs text-white placeholder-slate-500"
                />
              </div>

              {/* Government ID Toggle */}
              <div className="p-3.5 rounded-lg bg-purple-950/20 border border-purple-500/20 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGovtDoc}
                    onChange={(e) => setIsGovtDoc(e.target.checked)}
                    className="rounded bg-[#070D1A] border-purple-800 text-purple-600"
                  />
                  <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Government ID / Legal Document
                  </span>
                </label>

                {isGovtDoc && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                    <div>
                      <select
                        {...register('govt_id_type')}
                        className="w-full px-2.5 py-1.5 rounded bg-[#070D1A] border border-purple-900/50 text-white text-xs"
                      >
                        {GOVT_ID_TYPES.map((t) => (
                          <option key={t} value={t} className="bg-[#091224]">{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        {...register('masked_identifier')}
                        type="text"
                        placeholder="ID number (auto-masked)"
                        className="w-full px-2.5 py-1.5 rounded bg-[#070D1A] border border-purple-900/50 text-white placeholder-slate-500 font-mono text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? 'Registering Report...' : 'Submit Lost Report (Background AI Matching Active)'}
          </button>
        </div>
      </form>
    </div>
  );
};
