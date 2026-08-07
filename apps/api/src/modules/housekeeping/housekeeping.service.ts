import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BookingHelperService } from '../bookings/services/booking-helper.service';
import { UpdateUnitStatusDto } from './dto/update-unit-status.dto';
import { BatchGenerateUnitsDto } from './dto/batch-generate-units.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CleanlinessStatus, TaskStatus } from '@prisma/client';

@Injectable()
export class HousekeepingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly helper: BookingHelperService,
  ) {}

  /**
   * Get all room units for property with cleanliness status & active tasks
   */
  async getUnits(userId: string, propertyId?: string, roomTypeId?: string, status?: CleanlinessStatus) {
    const resolvedPropertyId = await this.helper.resolvePropertyId(userId, propertyId);

    // 1. Auto-initialize room units for any RoomType that has 0 units generated
    const roomTypes = await this.prisma.roomType.findMany({
      where: { propertyId: resolvedPropertyId },
    });

    for (let rtIndex = 0; rtIndex < roomTypes.length; rtIndex++) {
      const rt = roomTypes[rtIndex];
      const existingCount = await this.prisma.roomUnit.count({
        where: { propertyId: resolvedPropertyId, roomTypeId: rt.id },
      });

      const targetUnits = Math.max(1, rt.totalUnits);
      if (existingCount < targetUnits) {
        const startNum = (rtIndex + 1) * 100 + existingCount + 1;
        const missingCount = targetUnits - existingCount;
        for (let i = 0; i < missingCount; i++) {
          const num = startNum + i;
          const prefix = rt.name.toLowerCase().includes('villa') ? 'Villa ' : '';
          const unitNumber = prefix ? `${prefix}${num}` : `${num}`;
          try {
            await this.prisma.roomUnit.create({
              data: {
                propertyId: resolvedPropertyId,
                roomTypeId: rt.id,
                unitNumber,
                cleanlinessStatus: CleanlinessStatus.CLEAN,
              },
            });
          } catch {}
        }
        try {
          await this.prisma.roomType.update({
            where: { id: rt.id },
            data: { totalUnits: Math.max(rt.totalUnits, targetUnits) },
          });
        } catch {}
      }
    }

    // 2. Fetch units with room type, tasks, and recent checkout/stay booking info
    const where: any = { propertyId: resolvedPropertyId };
    if (roomTypeId) where.roomTypeId = roomTypeId;
    if (status) where.cleanlinessStatus = status;

    const units = await this.prisma.roomUnit.findMany({
      where,
      include: {
        roomType: { select: { id: true, name: true, basePrice: true } },
        bookings: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            checkInDate: true,
            checkOutDate: true,
            updatedAt: true,
            guest: { select: { fullName: true, phone: true } },
          },
        },
        tasks: {
          where: { status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] } },
          include: { assignedToUser: { select: { id: true, email: true, role: true } } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ floor: 'asc' }, { unitNumber: 'asc' }],
    });

    // Summary counts
    const counts = await this.prisma.roomUnit.groupBy({
      by: ['cleanlinessStatus'],
      where: { propertyId: resolvedPropertyId },
      _count: { _all: true },
    });

    const summary = {
      total: units.length,
      clean: counts.find((c) => c.cleanlinessStatus === CleanlinessStatus.CLEAN)?._count._all || 0,
      dirty: counts.find((c) => c.cleanlinessStatus === CleanlinessStatus.DIRTY)?._count._all || 0,
      inspected: counts.find((c) => c.cleanlinessStatus === CleanlinessStatus.INSPECTED)?._count._all || 0,
      outOfOrder: counts.find((c) => c.cleanlinessStatus === CleanlinessStatus.OUT_OF_ORDER)?._count._all || 0,
    };

    return { units, summary };
  }

  /**
   * Update cleanliness status of a room unit
   */
  async updateUnitStatus(userId: string, unitId: string, dto: UpdateUnitStatusDto) {
    const unit = await this.prisma.roomUnit.findUnique({
      where: { id: unitId },
    });
    if (!unit) throw new NotFoundException('Room unit not found');

    await this.helper.resolvePropertyId(userId, unit.propertyId);

    return this.prisma.roomUnit.update({
      where: { id: unitId },
      data: {
        cleanlinessStatus: dto.cleanlinessStatus,
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        roomType: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Batch generate room units for a room type (e.g. 101, 102... or Villa 1, Villa 2...)
   */
  async batchGenerateUnits(userId: string, dto: BatchGenerateUnitsDto) {
    const propertyId = await this.helper.resolvePropertyId(userId, dto.propertyId);

    const roomType = await this.prisma.roomType.findFirst({
      where: { id: dto.roomTypeId, propertyId, isActive: true },
    });
    if (!roomType) throw new NotFoundException('Room type not found or inactive');

    const existingCount = await this.prisma.roomUnit.count({
      where: { propertyId, roomTypeId: dto.roomTypeId },
    });

    const startNum = dto.startNumber || (existingCount + 1);
    const unitsToCreate = Math.max(1, roomType.totalUnits - existingCount);

    const createdUnits = [];
    for (let i = 0; i < unitsToCreate; i++) {
      const num = startNum + i;
      const prefix = dto.prefix || (roomType.name.toLowerCase().includes('villa') ? 'Villa ' : '');
      const unitNumber = prefix ? `${prefix}${num}` : `${num}`;

      try {
        const u = await this.prisma.roomUnit.create({
          data: {
            propertyId,
            roomTypeId: dto.roomTypeId,
            unitNumber,
            cleanlinessStatus: CleanlinessStatus.CLEAN,
          },
        });
        createdUnits.push(u);
      } catch (e) {
        // Skip duplicate unit number conflicts
        console.warn(`Unit ${unitNumber} already exists, skipping.`);
      }
    }

    return { createdCount: createdUnits.length, units: createdUnits };
  }

  /**
   * Create custom named room unit (e.g., Lotus, Lilly, Rose, Villa Sunset)
   */
  async createUnit(userId: string, dto: any) {
    const resolvedPropertyId = await this.helper.resolvePropertyId(userId, dto.propertyId);

    const roomType = await this.prisma.roomType.findFirst({
      where: { id: dto.roomTypeId, propertyId: resolvedPropertyId },
    });
    if (!roomType) throw new NotFoundException('Room category not found');

    try {
      const unit = await this.prisma.roomUnit.create({
        data: {
          propertyId: resolvedPropertyId,
          roomTypeId: dto.roomTypeId,
          unitNumber: dto.unitNumber.trim(),
          floor: dto.floor,
          notes: dto.notes,
          cleanlinessStatus: dto.cleanlinessStatus || CleanlinessStatus.CLEAN,
        },
      });

      // Keep totalUnits on RoomType in sync
      const currentUnitsCount = await this.prisma.roomUnit.count({
        where: { roomTypeId: dto.roomTypeId },
      });
      await this.prisma.roomType.update({
        where: { id: dto.roomTypeId },
        data: { totalUnits: currentUnitsCount },
      });

      return unit;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException(`A room named "${dto.unitNumber}" already exists in this property.`);
      }
      throw error;
    }
  }

  /**
   * Update room unit name or category (e.g. rename room to Lotus or Lilly)
   */
  async updateUnit(userId: string, id: string, dto: any) {
    const unit = await this.prisma.roomUnit.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException('Room unit not found');

    try {
      const updated = await this.prisma.roomUnit.update({
        where: { id },
        data: {
          ...(dto.unitNumber && { unitNumber: dto.unitNumber.trim() }),
          ...(dto.roomTypeId && { roomTypeId: dto.roomTypeId }),
          ...(dto.floor !== undefined && { floor: dto.floor }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
          ...(dto.cleanlinessStatus && { cleanlinessStatus: dto.cleanlinessStatus }),
        },
      });
      return updated;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException(`A room named "${dto.unitNumber}" already exists in this property.`);
      }
      throw error;
    }
  }

  /**
   * Delete room unit
   */
  async deleteUnit(userId: string, id: string) {
    const unit = await this.prisma.roomUnit.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException('Room unit not found');

    const activeBooking = await this.prisma.booking.findFirst({
      where: { roomUnitId: id, status: 'CHECKED_IN' },
    });
    if (activeBooking) {
      throw new BadRequestException('Cannot delete room while a guest is currently checked in');
    }

    await this.prisma.roomUnit.delete({ where: { id } });

    const remainingCount = await this.prisma.roomUnit.count({
      where: { roomTypeId: unit.roomTypeId },
    });
    await this.prisma.roomType.update({
      where: { id: unit.roomTypeId },
      data: { totalUnits: remainingCount },
    });

    return { message: 'Room deleted successfully' };
  }

  /**
   * Get Housekeeping Tasks
   */
  async getTasks(userId: string, propertyId?: string, status?: TaskStatus) {
    const resolvedPropertyId = await this.helper.resolvePropertyId(userId, propertyId);

    return this.prisma.housekeepingTask.findMany({
      where: {
        propertyId: resolvedPropertyId,
        ...(status && { status }),
      },
      include: {
        roomUnit: { include: { roomType: { select: { name: true } } } },
        assignedToUser: { select: { id: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create Housekeeping Task
   */
  async createTask(userId: string, dto: CreateTaskDto) {
    const unit = await this.prisma.roomUnit.findUnique({ where: { id: dto.roomUnitId } });
    if (!unit) throw new NotFoundException('Room unit not found');

    await this.helper.resolvePropertyId(userId, unit.propertyId);

    return this.prisma.housekeepingTask.create({
      data: {
        propertyId: unit.propertyId,
        roomUnitId: dto.roomUnitId,
        assignedToUserId: dto.assignedToUserId || userId,
        status: TaskStatus.PENDING,
        reportedIssue: dto.reportedIssue,
      },
      include: {
        roomUnit: { include: { roomType: { select: { name: true } } } },
        assignedToUser: { select: { id: true, email: true, role: true } },
      },
    });
  }

  /**
   * Update Housekeeping Task Status (PENDING -> IN_PROGRESS -> COMPLETED)
   */
  async updateTask(userId: string, taskId: string, dto: UpdateTaskDto) {
    const task = await this.prisma.housekeepingTask.findUnique({
      where: { id: taskId },
      include: { roomUnit: true },
    });
    if (!task) throw new NotFoundException('Housekeeping task not found');

    await this.helper.resolvePropertyId(userId, task.propertyId);

    const isCompleting = dto.status === TaskStatus.COMPLETED;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.housekeepingTask.update({
        where: { id: taskId },
        data: {
          ...(dto.status && { status: dto.status }),
          ...(dto.assignedToUserId && { assignedToUserId: dto.assignedToUserId }),
          ...(dto.reportedIssue !== undefined && { reportedIssue: dto.reportedIssue }),
          ...(isCompleting && { completedAt: new Date() }),
        },
        include: {
          roomUnit: { include: { roomType: { select: { name: true } } } },
          assignedToUser: { select: { id: true, email: true } },
        },
      });

      // If completing cleaning task, update unit cleanliness status to CLEAN
      if (isCompleting) {
        await tx.roomUnit.update({
          where: { id: task.roomUnitId },
          data: { cleanlinessStatus: CleanlinessStatus.CLEAN },
        });
      }

      return updated;
    });
  }
}
