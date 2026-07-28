// hooks/useBookings.ts
import { useEffect, useState } from 'react';
import { Booking } from '@/types/booking';
import api from '@/api/axios';

export const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!user?.id) {
      setError('User not found');
      setLoading(false);
      return;
    }

    const fetchBookings = async () => {
      try {
        const { data } = await api.get('/booking/my-booking/me');
        const userBookings = data?.data?.filter((booking: Booking) => booking.parentId === user.id);
        setBookings(userBookings);
      } catch (err) {
        console.error(err);
        setError('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []); // No telegramUserId in dependencies

  return { bookings, loading, error };
};
