import { httpClient } from '@/lib/api/http-client';

export interface RoomUnit {
  id: string;
  propertyId: string;
  roomTypeId: string;
  unitNumber: string;
  floor?: string;
  cleanlinessStatus: 'CLEAN' | 'DIRTY' | 'INSPECTED' | 'OUT_OF_ORDER';
  notes?: string;
  roomType?: { id: string; name: string; basePrice?: number | string };
  bookings?: { id: string; status: string; checkInDate: string; checkOutDate: string; guest?: { fullName: string; phone?: string } }[];
  tasks?: HousekeepingTask[];
}

export interface HousekeepingSummary {
  total: number;
  clean: number;
  dirty: number;
  inspected: number;
  outOfOrder: number;
}

export interface HousekeepingTask {
  id: string;
  propertyId: string;
  roomUnitId: string;
  assignedToUserId?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  reportedIssue?: string;
  createdAt: string;
  completedAt?: string;
  roomUnit?: RoomUnit;
  assignedToUser?: { id: string; email: string; role: string };
}

export const housekeepingService = {
  async getUnits(propertyId?: string, roomTypeId?: string, status?: string) {
    const params = new URLSearchParams();
    if (propertyId) params.append('propertyId', propertyId);
    if (roomTypeId) params.append('roomTypeId', roomTypeId);
    if (status) params.append('status', status);

    return httpClient.get<{ units: RoomUnit[]; summary: HousekeepingSummary }>(`/housekeeping/units?${params.toString()}`);
  },

  async updateUnitStatus(unitId: string, cleanlinessStatus: string, notes?: string) {
    return httpClient.patch<RoomUnit>(`/housekeeping/units/${unitId}/status`, { cleanlinessStatus, notes });
  },

  async batchGenerateUnits(roomTypeId: string, prefix?: string, startNumber?: number, propertyId?: string) {
    return httpClient.post<{ createdCount: number; units: RoomUnit[] }>('/housekeeping/units/batch-generate', {
      roomTypeId,
      prefix,
      startNumber,
      propertyId,
    });
  },

  async createUnit(unitNumber: string, roomTypeId: string, floor?: string, notes?: string, propertyId?: string) {
    return httpClient.post<RoomUnit>('/housekeeping/units', { unitNumber, roomTypeId, floor, notes, propertyId });
  },

  async updateUnit(unitId: string, data: { unitNumber?: string; roomTypeId?: string; floor?: string; notes?: string }) {
    return httpClient.patch<RoomUnit>(`/housekeeping/units/${unitId}`, data);
  },

  async deleteUnit(unitId: string) {
    return httpClient.delete<{ message: string }>(`/housekeeping/units/${unitId}`);
  },

  async getTasks(propertyId?: string, status?: string) {
    const params = new URLSearchParams();
    if (propertyId) params.append('propertyId', propertyId);
    if (status) params.append('status', status);

    return httpClient.get<HousekeepingTask[]>(`/housekeeping/tasks?${params.toString()}`);
  },

  async createTask(roomUnitId: string, reportedIssue?: string, assignedToUserId?: string) {
    return httpClient.post<HousekeepingTask>('/housekeeping/tasks', { roomUnitId, reportedIssue, assignedToUserId });
  },

  async updateTask(taskId: string, status?: string, reportedIssue?: string, assignedToUserId?: string) {
    return httpClient.patch<HousekeepingTask>(`/housekeeping/tasks/${taskId}`, { status, reportedIssue, assignedToUserId });
  },
};
