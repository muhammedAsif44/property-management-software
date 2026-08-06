import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { usePropertyStore } from '@/features/properties';
import { useToast } from '@/components/ui/toast';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000/realtime';

export function usePropertyRealtimeSync(): { socket: Socket | null; isConnected: boolean } {
  const activeProperty = usePropertyStore((s) => s.activeProperty);
  const queryClient = useQueryClient();
  const toast = useToast();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!activeProperty?.id) return;

    // Connect to NestJS Socket.IO gateway namespace /realtime
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_property', { propertyId: activeProperty.id });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Handle real-time booking updates from other connected devices
    socket.on('booking_created', (data: any) => {
      toast.info(
        `New booking received for ${data?.guestName || 'a guest'}!`,
        '⚡ Live Multi-Device Update'
      );
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['occupancy'] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    });

    socket.on('booking_updated', (data: any) => {
      toast.info(
        `Booking status updated for ${data?.guestName || 'a guest'}`,
        '⚡ Live Multi-Device Update'
      );
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['occupancy'] });
    });

    socket.on('room_status_changed', () => {
      toast.info('Room cleanliness status updated', '⚡ Live Housekeeping Update');
      queryClient.invalidateQueries({ queryKey: ['housekeeping'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    });

    // Handle WebSocket live system notifications broadcasted from backend
    socket.on('notification_created', (data: any) => {
      toast.info(data?.message || 'New in-app notification', data?.title || '🔔 System Announcement');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    return () => {
      if (activeProperty?.id) {
        socket.emit('leave_property', { propertyId: activeProperty.id });
      }
      socket.disconnect();
      setIsConnected(false);
    };
  }, [activeProperty?.id, queryClient, toast]);

  return { socket: socketRef.current, isConnected };
}
