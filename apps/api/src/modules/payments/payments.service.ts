import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Prisma, PaymentMode } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. Append-Only Payment / Refund Logger
   * Executed atomically in a single Prisma transaction with Decimal precision.
   */
  async recordPayment(
    userId: string,
    bookingId: string,
    dto: CreatePaymentDto,
    idempotencyKey?: string,
  ) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, deletedAt: null },
      include: { property: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const paymentAmount = new Prisma.Decimal(dto.amount);
    if (paymentAmount.isZero()) {
      throw new BadRequestException('Payment amount cannot be zero');
    }

    return this.prisma.$transaction(async (tx) => {
      // Aggregate existing payments to check for over-refunding
      const currentAggregate = await tx.payment.aggregate({
        where: { bookingId },
        _sum: { amount: true },
      });
      const currentPaid = currentAggregate._sum.amount || new Prisma.Decimal(0);

      if (paymentAmount.isNegative() && paymentAmount.abs().greaterThan(currentPaid)) {
        throw new BadRequestException(
          `Refund amount (₹${paymentAmount.abs()}) cannot exceed total paid amount (₹${currentPaid})`,
        );
      }

      // 1. Append new immutable Payment entry
      const payment = await tx.payment.create({
        data: {
          bookingId,
          amount: paymentAmount,
          mode: dto.mode || PaymentMode.CASH,
          gatewayTransactionId: dto.gatewayTransactionId,
          referenceNote: dto.referenceNote,
          paidAt: new Date(),
          createdByUserId: userId,
        },
      });

      // 2. Aggregate all payments to compute total paid & exact balance due
      const aggregate = await tx.payment.aggregate({
        where: { bookingId },
        _sum: { amount: true },
      });

      const totalPaid = (aggregate._sum.amount || new Prisma.Decimal(0)).plus(booking.advancePaid || 0);
      const newBalanceDue = Prisma.Decimal.max(new Prisma.Decimal(0), booking.totalAmount.minus(totalPaid));

      // 3. Update booking balanceDue and increment version (Optimistic Concurrency)
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          balanceDue: newBalanceDue,
          version: { increment: 1 },
        },
      });

      return {
        message: paymentAmount.isNegative()
          ? 'Refund recorded successfully'
          : 'Payment recorded successfully',
        payment: {
          id: payment.id,
          bookingId: payment.bookingId,
          amount: payment.amount.toNumber(),
          mode: payment.mode,
          referenceNote: payment.referenceNote,
          paidAt: payment.paidAt,
          createdAt: payment.createdAt,
        },
        financials: {
          totalAmount: updatedBooking.totalAmount.toNumber(),
          totalPaid: totalPaid.toNumber(),
          balanceDue: newBalanceDue.toNumber(),
        },
      };
    });
  }

  /**
   * 2. Retrieve Complete Append-Only Payment Ledger for a Booking
   */
  async getBookingPayments(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, deletedAt: null },
      select: {
        id: true,
        totalAmount: true,
        balanceDue: true,
        advancePaid: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const payments = await this.prisma.payment.findMany({
      where: { bookingId },
      orderBy: { paidAt: 'desc' },
      include: {
        createdByUser: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    const totalPaidSum = payments.reduce(
      (sum, p) => sum.plus(p.amount),
      new Prisma.Decimal(booking.advancePaid || 0),
    );

    const balanceDue = Prisma.Decimal.max(
      new Prisma.Decimal(0),
      booking.totalAmount.minus(totalPaidSum),
    );

    return {
      totalAmount: booking.totalAmount.toNumber(),
      totalPaid: totalPaidSum.toNumber(),
      balanceDue: balanceDue.toNumber(),
      payments: payments.map((p) => ({
        id: p.id,
        amount: p.amount.toNumber(),
        mode: p.mode,
        referenceNote: p.referenceNote,
        paidAt: p.paidAt,
        createdByUser: p.createdByUser,
        isRefund: p.amount.isNegative(),
      })),
    };
  }
}
