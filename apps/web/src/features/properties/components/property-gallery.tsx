'use client';

import React, { useState, useRef, useMemo } from 'react';
import { usePropertyStore } from '../store/use-property-store';
import { propertyService } from '../services/property.service';
import { DriftWall, DriftWallItem } from '@/components/ui/drift-wall';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Image as ImageIcon,
  Upload,
  Plus,
  Trash2,
  Maximize2,
  X,
  Building2,
  Sparkles,
  LayoutGrid,
  Film,
  Info,
  CheckCircle2,
  Eye,
  Moon,
  Sun,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useTheme } from '@/lib/theme/theme-context';

// Initial default high-res hotel property photos if property gallery is uninitialized
const DEFAULT_PROPERTY_PHOTOS: DriftWallItem[] = [
  {
    id: 'photo-1',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    title: 'Property Exterior & Entrance',
  },
  {
    id: 'photo-2',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    title: 'Grand Reception Lobby',
  },
  {
    id: 'photo-3',
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
    title: 'Executive Deluxe Suite',
  },
  {
    id: 'photo-4',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
    title: 'Infinity Pool & Sunset Deck',
  },
  {
    id: 'photo-5',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    title: 'Wellness Spa & Jacuzzi',
  },
];

export function PropertyGallery() {
  const { t } = useTranslation();
  const toast = useToast();
  const { resolvedTheme } = useTheme();
  const activeProperty = usePropertyStore((state) => state.activeProperty);
  const setActiveProperty = usePropertyStore((state) => state.setActiveProperty);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<'drift' | 'grid'>('drift');
  const [driftTheme, setDriftTheme] = useState<'dark' | 'light'>(resolvedTheme);
  const [previewItem, setPreviewItem] = useState<DriftWallItem | null>(null);
  const [photoTitle, setPhotoTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Sync driftTheme automatically when main app system theme changes
  React.useEffect(() => {
    setDriftTheme(resolvedTheme);
  }, [resolvedTheme]);

  // Active property gallery images stored in property settings
  const galleryImages: DriftWallItem[] = useMemo(() => {
    if (activeProperty?.settings?.galleryImages && Array.isArray(activeProperty.settings.galleryImages)) {
      return activeProperty.settings.galleryImages;
    }
    return DEFAULT_PROPERTY_PHOTOS;
  }, [activeProperty]);

  // Persist updated gallery images to active property store & backend
  const updateGallery = async (newImages: DriftWallItem[]) => {
    if (!activeProperty) return;

    const updatedSettings = {
      ...(activeProperty.settings || {}),
      galleryImages: newImages,
    };

    const updatedProperty = {
      ...activeProperty,
      settings: updatedSettings,
    };

    setActiveProperty(updatedProperty);

    try {
      await propertyService.saveOnboardingStep(activeProperty.id, {
        step: activeProperty.onboardingStep || 1,
        settings: updatedSettings,
      });
    } catch {
      // Ignore background save errors
    }
  };

  // Upload Photo File Reader Handler
  const handleFileUpload = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPG, PNG, WebP).', 'Invalid File');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size should be under 10MB.', 'File Too Large');
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Url = e.target?.result as string;
      if (base64Url) {
        const newItem: DriftWallItem = {
          id: `photo-${Date.now()}`,
          image: base64Url,
          title: photoTitle.trim() || file.name.replace(/\.[^/.]+$/, ''),
        };

        const nextGallery = [newItem, ...galleryImages];
        updateGallery(nextGallery);
        toast.success(`Photo "${newItem.title}" added to property gallery!`, 'Photo Uploaded');
        setPhotoTitle('');
      }
      setIsUploading(false);
    };

    reader.onerror = () => {
      toast.error('Failed to read image file.', 'Upload Error');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  // Delete Photo Handler
  const handleDeletePhoto = (item: DriftWallItem) => {
    const nextGallery = galleryImages.filter((img) => img.id !== item.id);
    updateGallery(nextGallery);
    toast.info(`Removed "${item.title || 'Photo'}" from property gallery.`, 'Photo Removed');
    if (previewItem?.id === item.id) {
      setPreviewItem(null);
    }
  };

  // Drag and Drop Zone Event Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // Close preview modal on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewItem(null);
      }
    };
    if (previewItem) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewItem]);

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      {/* Header & Controls Bar */}
      <div className="bg-white dark:bg-[#111c17] rounded-2xl border border-slate-200 dark:border-[#1d3329] p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Property Gallery
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
              {galleryImages.length} {galleryImages.length === 1 ? 'Photo' : 'Photos'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage, upload, preview, and organize high-resolution property photos for marketing and guest invoices.
          </p>
          {activeProperty && (
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mt-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>Property Context: <strong>{activeProperty.name}</strong> ({activeProperty.city || 'India'})</span>
            </p>
          )}
        </div>

        {/* View Mode Toggle, Canvas Theme Switcher & Upload Button */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#16241e] rounded-xl border border-slate-200 dark:border-[#1d3329]">
            <button
              onClick={() => setViewMode('drift')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'drift'
                  ? 'bg-white dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-transparent dark:border-emerald-800/80 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Drift Wall</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-transparent dark:border-emerald-800/80 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Standard Grid</span>
            </button>
          </div>

          {/* Canvas Theme Toggle (Dark vs Light) */}
          {viewMode === 'drift' && (
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#16241e] rounded-xl border border-slate-200 dark:border-[#1d3329]">
              <button
                type="button"
                onClick={() => setDriftTheme('dark')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  driftTheme === 'dark'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
                title="Dark Moody Canvas Preset"
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark Canvas</span>
              </button>
              <button
                type="button"
                onClick={() => setDriftTheme('light')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  driftTheme === 'light'
                    ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
                title="Light Canvas Preset"
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light Canvas</span>
              </button>
            </div>
          )}

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="h-9 px-4 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Upload Photos</span>
          </Button>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-white dark:bg-[#111c17] rounded-2xl border-2 border-dashed p-5 transition-all flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isDragOver
            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
            : 'border-slate-200/80 dark:border-[#1d3329] hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              Drag & Drop Property Photos Here
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Supports High-Res JPG, PNG, WebP (Max 10MB per file).
            </p>
          </div>
        </div>

        {/* Optional Title Label & File Trigger */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            value={photoTitle}
            onChange={(e) => setPhotoTitle(e.target.value)}
            placeholder="Photo Title (e.g. Executive Suite)"
            className="h-8 text-xs max-w-xs"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 text-xs font-bold cursor-pointer shrink-0"
          >
            Browse File
          </Button>
        </div>
      </div>

      {/* ─── GALLERY DISPLAY SECTION ─── */}
      {galleryImages.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-[#111c17] rounded-2xl border border-slate-200 dark:border-[#1d3329] p-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <ImageIcon className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Property Photos Uploaded</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
            Upload high-resolution property exterior, lobby, room, and amenity photos to showcase your hotel.
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="h-9 px-4 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Upload First Photo</span>
          </Button>
        </div>
      ) : viewMode === 'drift' ? (
        /* ─── DRIFT WALL ANIMATED PRESENTATION ─── */
        <div className="bg-white dark:bg-[#111c17] rounded-2xl border border-slate-200 dark:border-[#1d3329] p-4 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-slate-100 dark:border-[#1d3329]">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Interactive Drift Wall Presentation ({driftTheme === 'dark' ? 'Dark Mode' : 'Light Mode'})
            </span>
            <span className="text-[10px] font-medium text-slate-400">
              Hover to pause drift & preview actions
            </span>
          </div>

          <DriftWall
            items={galleryImages}
            columns={5}
            tileWidth={210}
            tileHeight={140}
            gap={18}
            radius={16}
            speed={1}
            pauseOnHover={true}
            lift={true}
            parallax={true}
            theme={driftTheme}
            onItemClick={(item) => setPreviewItem(item)}
            onItemDelete={(item) => handleDeletePhoto(item)}
          />
        </div>
      ) : (
        /* ─── STANDARD RESPONSIVE GRID PRESENTATION ─── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {galleryImages.map((photo) => (
            <div
              key={photo.id}
              className="group bg-white dark:bg-[#111c17] rounded-2xl border border-slate-200 dark:border-[#1d3329] overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col"
            >
              <div
                className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-[#16241e] cursor-pointer"
                onClick={() => setPreviewItem(photo)}
              >
                <img
                  src={photo.image}
                  alt={photo.title || 'Property Photo'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewItem(photo);
                    }}
                    className="p-2 rounded-xl bg-white/90 text-slate-900 hover:bg-white transition shadow-sm cursor-pointer"
                    title="Preview Photo"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(photo);
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition shadow-sm cursor-pointer"
                    title="Delete Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {photo.title || 'Property Photo'}
                </p>
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(photo)}
                  className="text-slate-400 hover:text-rose-600 transition p-1 rounded-md cursor-pointer"
                  title="Remove Photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── ANIMATED FULLSCREEN PREVIEW LIGHTBOX MODAL ─── */}
      {previewItem && (
        <>
          <div
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md transition-all animate-in fade-in-0 duration-200"
            onClick={() => setPreviewItem(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
              className="bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl max-w-5xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 fade-in-0 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 sm:px-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      {previewItem.title || 'Property Photo Preview'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {activeProperty?.name || 'Hotel Property'} · Asset HD Preview
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(previewItem)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/80 text-rose-300 border border-rose-800 hover:bg-rose-900 transition text-xs font-bold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewItem(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    title="Close (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Image Display Frame */}
              <div className="p-6 bg-slate-950/90 flex items-center justify-center overflow-auto max-h-[75vh]">
                <img
                  src={previewItem.image}
                  alt={previewItem.title || 'Preview'}
                  className="max-h-[68vh] w-auto object-contain rounded-xl shadow-2xl border border-slate-800/50"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

