'use client';

import React from 'react';
import { Building2, X, Loader2, Edit3, Trash2, Wrench } from 'lucide-react';
import { RoomUnit } from '@/features/housekeeping/services/housekeeping.service';

function ModalOverlay({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-150">{children}</div>
    </div>
  );
}

/* ═══ Add Room Modal ═══ */
interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomTypes: any[];
  newRoomName: string;
  setNewRoomName: (val: string) => void;
  newRoomTypeId: string;
  setNewRoomTypeId: (val: string) => void;
  newRoomFloor: string;
  setNewRoomFloor: (val: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function AddRoomModal({
  isOpen,
  onClose,
  roomTypes,
  newRoomName,
  setNewRoomName,
  newRoomTypeId,
  setNewRoomTypeId,
  newRoomFloor,
  setNewRoomFloor,
  onSubmit,
  isPending,
}: AddRoomModalProps) {
  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 font-sans text-slate-900 dark:text-white">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            Add New Room Unit
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Room / Door Number *
            </label>
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="e.g. 101 or A-102"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Room Category *
            </label>
            <select
              value={newRoomTypeId}
              onChange={(e) => setNewRoomTypeId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="">Select Category...</option>
              {roomTypes.map((rt: any) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Floor / Location (Optional)
            </label>
            <input
              type="text"
              value={newRoomFloor}
              onChange={(e) => setNewRoomFloor(e.target.value)}
              placeholder="e.g. 1st Floor, Pool Wing"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!newRoomName || !newRoomTypeId || isPending}
            className="px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Add Room Unit</span>
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

/* ═══ Edit Room Modal ═══ */
interface EditRoomModalProps {
  isOpen?: boolean;
  editingUnit: RoomUnit | null;
  onClose: () => void;
  roomTypes: any[];
  editRoomName: string;
  setEditRoomName: (val: string) => void;
  editRoomTypeId: string;
  setEditRoomTypeId: (val: string) => void;
  editRoomFloor: string;
  setEditRoomFloor: (val: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function EditRoomModal({
  isOpen,
  editingUnit,
  onClose,
  roomTypes,
  editRoomName,
  setEditRoomName,
  editRoomTypeId,
  setEditRoomTypeId,
  editRoomFloor,
  setEditRoomFloor,
  onSubmit,
  isPending,
}: EditRoomModalProps) {
  const isModalOpen = isOpen !== undefined ? isOpen : !!editingUnit;

  return (
    <ModalOverlay isOpen={isModalOpen} onClose={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 font-sans text-slate-900 dark:text-white">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-emerald-600" />
            Edit Room — {editingUnit?.unitNumber || editRoomName}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Room / Door Number *
            </label>
            <input
              type="text"
              value={editRoomName}
              onChange={(e) => setEditRoomName(e.target.value)}
              placeholder="e.g. 101"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Room Category *
            </label>
            <select
              value={editRoomTypeId}
              onChange={(e) => setEditRoomTypeId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              {roomTypes.map((rt: any) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Floor / Location (Optional)
            </label>
            <input
              type="text"
              value={editRoomFloor}
              onChange={(e) => setEditRoomFloor(e.target.value)}
              placeholder="e.g. 1st Floor, Pool Wing"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!editRoomName || isPending}
            className="px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

/* ═══ Delete Room Modal ═══ */
interface DeleteRoomModalProps {
  isOpen?: boolean;
  deletingUnit: RoomUnit | null;
  onClose: () => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function DeleteRoomModal({
  isOpen,
  deletingUnit,
  onClose,
  onSubmit,
  isPending,
}: DeleteRoomModalProps) {
  const isModalOpen = isOpen !== undefined ? isOpen : !!deletingUnit;

  return (
    <ModalOverlay isOpen={isModalOpen} onClose={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 font-sans text-slate-900 dark:text-white">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Delete Room — {deletingUnit?.unitNumber}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
          Are you sure you want to delete room <strong className="text-slate-900 dark:text-white font-bold">{deletingUnit?.unitNumber}</strong>? This will remove the room from your physical inventory.
        </p>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Delete Room</span>
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

/* ═══ Maintenance / Out of Order Modal ═══ */
interface MaintenanceModalProps {
  isOpen?: boolean;
  issueUnit: RoomUnit | null;
  onClose: () => void;
  issueNotes: string;
  setIssueNotes: (val: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function MaintenanceModal({
  isOpen,
  issueUnit,
  onClose,
  issueNotes,
  setIssueNotes,
  onSubmit,
  isPending,
}: MaintenanceModalProps) {
  const isModalOpen = isOpen !== undefined ? isOpen : !!issueUnit;

  return (
    <ModalOverlay isOpen={isModalOpen} onClose={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 font-sans text-slate-900 dark:text-white">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-600" />
            Report Out of Order — Room {issueUnit?.unitNumber}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Reason / Maintenance Issue
          </label>
          <textarea
            value={issueNotes}
            onChange={(e) => setIssueNotes(e.target.value)}
            placeholder="Describe issue (e.g. AC repair, Plumbing, Deep clean)..."
            rows={3}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-600 resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Log Maintenance</span>
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
