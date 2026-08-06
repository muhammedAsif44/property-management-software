'use client';

import React from 'react';
import { Building2, X, Loader2, Edit3, Trash2, Wrench } from 'lucide-react';
import { RoomUnit } from '@/features/housekeeping/services/housekeeping.service';

function ModalOverlay({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md">{children}</div>
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
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 font-sans text-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-700" />
            Add New Room
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Room Name *
            </label>
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="e.g. Room 101"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Room Category *
            </label>
            <select
              value={newRoomTypeId}
              onChange={(e) => setNewRoomTypeId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600"
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
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Floor / Zone (Optional)
            </label>
            <input
              type="text"
              value={newRoomFloor}
              onChange={(e) => setNewRoomFloor(e.target.value)}
              placeholder="e.g. Floor 1, Main Block"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!newRoomName || !newRoomTypeId || isPending}
            className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Add Room
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

/* ═══ Edit Room Modal ═══ */
interface EditRoomModalProps {
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
  return (
    <ModalOverlay isOpen={!!editingUnit} onClose={onClose}>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 font-sans text-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-emerald-700" />
            Edit Room — {editingUnit?.unitNumber}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Room Name *
            </label>
            <input
              type="text"
              value={editRoomName}
              onChange={(e) => setEditRoomName(e.target.value)}
              placeholder="Enter room name..."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Room Category *
            </label>
            <select
              value={editRoomTypeId}
              onChange={(e) => setEditRoomTypeId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600"
            >
              {roomTypes.map((rt: any) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Floor / Zone (Optional)
            </label>
            <input
              type="text"
              value={editRoomFloor}
              onChange={(e) => setEditRoomFloor(e.target.value)}
              placeholder="e.g. Floor 1, Pool Wing"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!editRoomName || isPending}
            className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

/* ═══ Delete Room Modal ═══ */
interface DeleteRoomModalProps {
  deletingUnit: RoomUnit | null;
  onClose: () => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function DeleteRoomModal({
  deletingUnit,
  onClose,
  onSubmit,
  isPending,
}: DeleteRoomModalProps) {
  return (
    <ModalOverlay isOpen={!!deletingUnit} onClose={onClose}>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 font-sans text-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-black text-rose-600 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-600" />
            Delete Room — {deletingUnit?.unitNumber}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          Are you sure you want to delete room <strong className="text-slate-900 font-bold">{deletingUnit?.unitNumber}</strong>? This will permanently remove it from your inventory.
        </p>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Delete Room
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

/* ═══ Maintenance / Out of Order Modal ═══ */
interface MaintenanceModalProps {
  issueUnit: RoomUnit | null;
  onClose: () => void;
  issueNotes: string;
  setIssueNotes: (val: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function MaintenanceModal({
  issueUnit,
  onClose,
  issueNotes,
  setIssueNotes,
  onSubmit,
  isPending,
}: MaintenanceModalProps) {
  return (
    <ModalOverlay isOpen={!!issueUnit} onClose={onClose}>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 font-sans text-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-600" />
            Report Out of Order — Room {issueUnit?.unitNumber}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Reason / Maintenance Issue
          </label>
          <textarea
            value={issueNotes}
            onChange={(e) => setIssueNotes(e.target.value)}
            placeholder="Describe issue (e.g. AC repair, Plumbing)..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Mark Out of Order
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
