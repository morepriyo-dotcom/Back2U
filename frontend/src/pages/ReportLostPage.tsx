import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, Lock, Sparkles, MapPin, Tag, CheckCircle2 } from 'lucide-react';
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

export const ReportLostPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedItemId, setSubmittedItemId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LostFormData>({
    resolver: zodResolver(lostSchema),
    defaultValues: {
      category: 'Electronics',
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
      });
      setSubmittedItemId(created.id);
    } catch (err: any) {
      alert(err.message || 'Failed to submit lost report');
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
        <h2 className="text-2xl font-bold text-white">Lost Report Submitted Successfully</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Our AI has generated semantic and visual embeddings for your report and is continuously scanning active found listings.
        </p>
        <div className="flex justify-center gap-3 pt-4">
          <button
            onClick={() => navigate(`/items/${submittedItemId}`)}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
          >
            View Report & AI Matches
          </button>
          <button
            onClick={() => navigate('/my-reports')}
            className="px-6 py-2.5 rounded-full text-xs font-semibold text-slate-300 bg-[#0E1A33] border border-blue-500/30 hover:text-white"
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
          <span>Report a Lost Item</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Help AI Bring It Back2U
        </h1>
        <p className="text-xs text-slate-400">
          Provide accurate details about what was lost. Sensitive distinguishing features are stored privately to ensure secure verification.
        </p>
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
            placeholder="e.g. AirPods Pro in White Case with Sticker"
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
              Approximate Location *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                {...register('location_name')}
                type="text"
                placeholder="e.g. Campus Library, 2nd floor desk"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 transition-colors"
              />
            </div>
            {errors.location_name && <p className="text-xs text-red-400 mt-1">{errors.location_name.message}</p>}
          </div>
        </div>

        {/* Date Lost & Brand/Model */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Date & Approximate Time Lost *
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
              Private Distinguishing Clues (Confidential)
            </label>
          </div>
          <p className="text-[11px] text-slate-400">
            Never displayed publicly or in search results. Used exclusively to match and challenge ownership claims (e.g. scratches, internal contents, engravings, serial number fragments).
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
            Item Photograph (Optional)
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

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.45)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {submitting ? 'Generating AI Embeddings & Submitting...' : 'Submit Lost Report & Scan for Matches'}
          </button>
        </div>

      </form>

    </div>
  );
};
