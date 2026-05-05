import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '@/api/axios';
import { AppDispatch, RootState } from '@/redux/store';
import { fetchSpecialists } from '@/redux/slices/specialistSlice';
import { StarIcon, VideoIcon, MessageIcon, CallCenterIcon } from '@/design-system/icons';
import { BottomSheet, Button } from '@/components/ui';
import type { Professional } from '@/design-system/types';
import type { AvailabilitySlot } from '@/types/specialist';
import type { Booking } from '@/types/booking';

const getDateKey = (isoDate: string) => isoDate.split('T')[0];
const SESSION_MODE_STORAGE_KEY = 'consultation_session_modes';

const formatDateOption = (isoDate: string) => {
  const date = new Date(isoDate);
  return {
    id: getDateKey(isoDate),
    full: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    day: date.toLocaleDateString('en-US', { weekday: 'short' }),
    date: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
  };
};

const formatSlotRange = (slot: AvailabilitySlot) => `${slot.startTime} - ${slot.endTime}`;

const formatDisplayTime = (time: string) => {
  const [hourText = '0', minute = '00'] = time.split(':');
  const hour = Number(hourText);
  if (Number.isNaN(hour)) return time;

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour}:${minute} ${suffix}`;
};

const getStoredSessionModes = (): Record<string, 'Text' | 'Audio' | 'Video'> => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_MODE_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const storeSessionMode = (slotId: string, mode: 'Text' | 'Audio' | 'Video') => {
  const existing = getStoredSessionModes();
  existing[slotId] = mode;
  localStorage.setItem(SESSION_MODE_STORAGE_KEY, JSON.stringify(existing));
};

const isFutureSlot = (slot: AvailabilitySlot) => {
  try {
    const [hour, minute] = slot.startTime.split(':').map(Number);
    const date = new Date(slot.date);
    const slotDateTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hour,
      minute,
    );
    return slotDateTime.getTime() > Date.now();
  } catch {
    return false;
  }
};

const CallCenterView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [activeTab, setActiveTab] = useState<'Doctor' | 'Nutritionist' | 'Support' | 'Sessions'>('Doctor');
  const [bookingStep, setBookingStep] = useState<'selection' | 'payment'>('selection');
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<'Text' | 'Audio' | 'Video' | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  // Get specialists from Redux
  const { specialists, loading } = useSelector((state: RootState) => state.specialists);

  useEffect(() => {
    dispatch(fetchSpecialists({ page: 1, limit: 10 }));
  }, [dispatch]);

  const fetchBookings = async () => {
    const telegramUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!telegramUser?.id) {
      setBookings([]);
      setSessionsError('User not found');
      return;
    }

    try {
      setLoadingSessions(true);
      setSessionsError(null);
      const { data } = await api.get(`/booking/my-booking/parent/${telegramUser.id}`);
      setBookings(data?.data ?? []);
    } catch (error: any) {
      setSessionsError(error.response?.data?.message || 'Failed to load bookings');
      setBookings([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    void fetchBookings();
  }, []);

  // Transform backend specialists to match UI format
  const professionals: Professional[] = specialists.map(s => {
    // Map backend role to UI type
    const roleToType = (role: string): 'Doctor' | 'Nutritionist' => {
      if (role === 'NUTRITIONIST') return 'Nutritionist';
      return 'Doctor'; // PEDIATRICIAN, CULINARIAN, etc. map to Doctor
    };

    return {
      id: s.id,
      name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Specialist',
      title: s.SpecialistProfile?.specialty || roleToType(s.role),
      type: roleToType(s.role),
      image: s.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.id}`,
      availability: 'Available for booking',
      rating: 4.8, // Backend doesn't have rating, using default
      fee: 350, // Default fee, can be updated when backend supports it
      specialty: s.SpecialistProfile?.specialty || 'Child Care',
    };
  });

  const availableSlots = availabilitySlots
    .filter((slot) => !slot.isBooked && slot.startTime && slot.date && isFutureSlot(slot))
    .sort((a, b) => {
      const aDateTime = new Date(`${getDateKey(a.date)}T${a.startTime}`);
      const bDateTime = new Date(`${getDateKey(b.date)}T${b.startTime}`);
      return aDateTime.getTime() - bDateTime.getTime();
    });

  const dateOptions = availableSlots.reduce<Array<ReturnType<typeof formatDateOption>>>((acc, slot) => {
    const option = formatDateOption(slot.date);
    if (!acc.some((item) => item.id === option.id)) {
      acc.push(option);
    }
    return acc;
  }, []);

  const slotsForSelectedDate = availableSlots.filter((slot) => getDateKey(slot.date) === selectedDateKey);
  const selectedSlot = availableSlots.find((slot) => slot.id === selectedSlotId) ?? null;

  const fetchAvailability = async (expertId: string) => {
    try {
      setLoadingAvailability(true);
      setAvailabilityError(null);
      const response = await api.get<AvailabilitySlot[]>(`/availability/find-availability/${expertId}`);
      const slots = response.data ?? [];
      const nextAvailableSlots = slots
        .filter((slot) => !slot.isBooked && slot.startTime && slot.date && isFutureSlot(slot))
        .sort((a, b) => {
          const aDateTime = new Date(`${getDateKey(a.date)}T${a.startTime}`);
          const bDateTime = new Date(`${getDateKey(b.date)}T${b.startTime}`);
          return aDateTime.getTime() - bDateTime.getTime();
        });

      setAvailabilitySlots(nextAvailableSlots);
      setBookingStep('selection');
      setSelectedDateKey(nextAvailableSlots[0] ? getDateKey(nextAvailableSlots[0].date) : '');
    } catch (error: any) {
      setAvailabilitySlots([]);
      setSelectedDateKey('');
      setAvailabilityError(error.response?.data?.message || 'Unable to load availability right now.');
    } finally {
      setLoadingAvailability(false);
    }
  };

  const resetBookingState = () => {
    setBookingStep('selection');
    setSelectedPro(null);
    setAvailabilitySlots([]);
    setAvailabilityError(null);
    setSelectedDateKey('');
    setSelectedSlotId(null);
    setSelectedMode(null);
    setBookingError(null);
  };

  useEffect(() => {
    if (selectedPro) {
      fetchAvailability(selectedPro.id);
    }
  }, [selectedPro]);

  useEffect(() => {
    setSelectedSlotId(null);
  }, [selectedDateKey]);

  const isSessionActive = (slot: Booking['slot']) => {
    try {
      const [hour, minute] = slot.startTime.split(':').map(Number);
      const date = new Date(slot.date);
      const slotDateTime = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        hour,
        minute,
      );
      return Date.now() >= slotDateTime.getTime();
    } catch {
      return false;
    }
  };

  const handleBookConsultation = async () => {
    if (!selectedPro || !selectedMode || !selectedSlot) return;

    const telegramUser = JSON.parse(localStorage.getItem('user') || '{}');
    const favoriteChildId = localStorage.getItem('favorite_child_id');

    if (!telegramUser?.id || !favoriteChildId) {
      setBookingError('Select an active child before booking a consultation.');
      return;
    }

    try {
      setBookingError(null);
      await api.post('/booking/create', {
        parentId: telegramUser.id,
        expertId: selectedPro.id,
        slotId: selectedSlot.id,
        childId: favoriteChildId,
      });
      storeSessionMode(selectedSlot.id, selectedMode);
      await fetchBookings();
      setActiveTab('Sessions');

      // Navigate to existing chat or video call based on mode
      resetBookingState();
    } catch (error: any) {
      setBookingError(error.response?.data?.message || 'Booking failed. Try again.');
    }
  };

  return (
    <div className="pb-32 pt-4">
      <div className="px-6 mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Expert Care</h2>
          <p className="text-slate-500 text-sm">Consult with verified child experts.</p>
        </div>
        <button
          onClick={() => {
            setActiveTab('Sessions');
            void fetchBookings();
          }}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'Sessions' ? 'bg-[#76A13B] text-white' : 'bg-slate-100 text-slate-400'
          }`}
        >
          My Sessions
        </button>
      </div>

      {activeTab !== 'Sessions' && (
      <div className="px-6 flex gap-2 mb-10">
        {(['Doctor', 'Nutritionist', 'Support'] as const).map(type => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase transition-all ${
              activeTab === type ? 'bg-[#0B1A12] text-white shadow-xl shadow-emerald-100' : 'bg-white border border-slate-100 text-slate-500'
            }`}
          >
            {type}
          </button>
        ))}
      </div>
      )}

      {activeTab === 'Sessions' ? (
        <div className="px-6 space-y-6 animate-in fade-in duration-300">
          <button
            onClick={() => setActiveTab('Doctor')}
            className="text-sm font-bold text-[#76A13B] transition-colors hover:text-[#5E832D]"
          >
            ← Back to Help
          </button>
          {loadingSessions ? (
            <div className="bg-slate-50 rounded-[3rem] p-12 text-center border border-slate-100">
              <p className="text-slate-400 font-medium">Loading sessions...</p>
            </div>
          ) : sessionsError ? (
            <div className="bg-rose-50 rounded-[3rem] p-12 text-center border border-rose-100">
              <p className="text-rose-500 font-medium">{sessionsError}</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-slate-50 rounded-[3rem] p-12 text-center border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm">🗓️</div>
              <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest mb-2">No Sessions Yet</h3>
              <p className="text-slate-400 text-xs font-medium">Your booked consultations will appear here.</p>
            </div>
          ) : (
            bookings.map((booking) => {
              const sessionMode = getStoredSessionModes()[booking.slotId];
              const isActive = isSessionActive(booking.slot);
              return (
                <div key={booking.id} className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden">
                  {isActive && (
                    <div className="absolute top-0 right-0 bg-[#76A13B] text-white px-4 py-1 text-[8px] font-black uppercase tracking-[0.2em] rounded-bl-2xl">
                      ACTIVE NOW
                    </div>
                  )}
                  <div className="flex gap-4 mb-6">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl overflow-hidden shadow-inner">
                      <img
                        src={booking.expert.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.expert.id}`}
                        className="w-full h-full object-cover"
                        alt={booking.expert.firstName}
                      />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800">{booking.expert.firstName} {booking.expert.lastName}</h4>
                      <p className="text-[10px] font-black text-[#76A13B] uppercase tracking-widest">{booking.status}</p>
                      {sessionMode && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-1 bg-slate-100 rounded-lg text-[8px] font-black text-slate-500 uppercase tracking-widest">{sessionMode}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-8 px-2">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Date & Time</span>
                      <span className="text-xs font-black text-slate-700">
                        {formatDateOption(booking.slot.date).full} • {formatDisplayTime(booking.slot.startTime)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <button
                      disabled={!isActive || sessionMode !== 'Text'}
                      onClick={() => navigate(`/chat/${booking.expert.id}`)}
                      className={`py-4 rounded-2xl flex items-center justify-center transition-all ${
                        isActive && sessionMode === 'Text' ? 'bg-[#0B1A12] text-white shadow-lg' : 'bg-slate-50 text-slate-200'
                      }`}
                    >
                      <MessageIcon />
                    </button>
                    <button
                      disabled={!isActive || sessionMode !== 'Audio'}
                      onClick={() => navigate('/video-call')}
                      className={`py-4 rounded-2xl flex items-center justify-center transition-all ${
                        isActive && sessionMode === 'Audio' ? 'bg-[#0B1A12] text-white shadow-lg' : 'bg-slate-50 text-slate-200'
                      }`}
                    >
                      <CallCenterIcon className="w-4 h-4" />
                    </button>
                    <button
                      disabled={!isActive || sessionMode !== 'Video'}
                      onClick={() => navigate('/video-call')}
                      className={`py-4 rounded-2xl flex items-center justify-center transition-all ${
                        isActive && sessionMode === 'Video' ? 'bg-[#0B1A12] text-white shadow-lg' : 'bg-slate-50 text-slate-200'
                      }`}
                    >
                      <VideoIcon />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : activeTab === 'Support' ? (
        <div className="px-6 animate-in fade-in slide-in-from-bottom">
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-[#76A13B]/10 rounded-[2.5rem] flex items-center justify-center mb-8 text-4xl shadow-inner">🎧</div>
            <h3 className="text-2xl font-black text-slate-800 mb-3 leading-tight">Instant App Help</h3>
            <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">Talk to our customer success team for any technical or general app queries. No booking needed.</p>
            <div className="flex flex-col gap-4 w-full">
              <Button
                color="purple"
                fullWidth
                size="lg"
                onClick={() => navigate('/chat/support')}
              >
                Instant Live Chat
              </Button>
              <Button
                color="slate"
                fullWidth
                size="lg"
              >
                Emergency Audio Call
              </Button>
            </div>
          </div>
        </div>
      ) : loading && professionals.length === 0 ? (
        <div className="px-6 py-12 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#76A13B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 font-medium">Loading specialists...</p>
          </div>
        </div>
      ) : professionals.filter(p => p.type === activeTab).length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="w-20 h-20 bg-[#76A13B]/10 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👨‍⚕️</span>
          </div>
          <p className="text-slate-600 font-bold mb-2">No {activeTab}s Available</p>
          <p className="text-slate-400 text-sm">Please check back later for available specialists.</p>
        </div>
      ) : (
        <div className="px-6 space-y-6">
          {professionals.filter(p => p.type === activeTab).map(pro => (
            <div key={pro.id} className="bg-white rounded-[2.5rem] p-6 border border-slate-50 shadow-sm">
              <div className="flex gap-5 mb-8">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] overflow-hidden flex-shrink-0 border-4 border-white shadow-sm">
                  <img src={pro.image} className="w-full h-full object-cover" alt={pro.name} />
                </div>
                <div className="flex-1 py-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-black text-slate-800 text-lg leading-tight">{pro.name}</h4>
                    <div className="flex items-center gap-1 text-amber-400 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                      <StarIcon className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black">{pro.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#76A13B] font-black mb-2 uppercase tracking-widest mt-1">{pro.title}</p>
                  <div className="inline-flex px-3 py-1 bg-slate-50 rounded-lg text-[9px] font-black text-slate-400 uppercase border border-slate-100 tracking-tighter">
                    {pro.specialty}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Session Fee</span>
                  <span className="text-xl font-black text-slate-900">{pro.fee} <span className="text-[10px] font-bold">ETB</span></span>
                </div>
                <button
                  onClick={() => {
                    setSelectedPro(pro);
                    setBookingStep('selection');
                    setSelectedDateKey('');
                    setSelectedSlotId(null);
                    setSelectedMode(null);
                    setBookingError(null);
                  }}
                  className="px-8 py-4 bg-[#0B1A12] text-white font-black rounded-[1.5rem] text-xs shadow-xl shadow-emerald-50 active:scale-95 transition-transform"
                >
                  Check Availability
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Bottom Sheet */}
      <BottomSheet
        isOpen={!!selectedPro}
        onClose={resetBookingState}
      >
        {selectedPro && (
          <>
            {bookingStep === 'selection' ? (
              <>
                <div className="flex flex-col items-center mb-10">
                  <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden mb-6 border-4 border-slate-50 shadow-md">
                    <img src={selectedPro.image} className="w-full h-full object-cover" alt={selectedPro.name} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-800">{selectedPro.name}</h2>
                  <p className="text-sm font-black text-[#76A13B] uppercase tracking-[0.2em] mt-1">{selectedPro.title}</p>
                  <div className="mt-6 px-6 py-3 bg-slate-50 rounded-2xl text-[10px] font-black text-slate-400 border border-slate-100 tracking-wider">
                    {loadingAvailability ? 'LOADING AVAILABILITY...' : `OPEN SLOTS: ${availableSlots.length}`}
                  </div>
                </div>

                <div className="space-y-6 mb-10">
                  <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-widest px-2">Select Date</h4>
                  {loadingAvailability ? (
                    <div className="px-2 text-sm font-medium text-slate-400">Loading available dates...</div>
                  ) : dateOptions.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto pb-2 px-2">
                      {dateOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSelectedDateKey(option.id)}
                          className={`flex-shrink-0 w-20 py-4 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${
                            selectedDateKey === option.id
                              ? 'bg-[#76A13B] text-white border-[#76A13B] shadow-lg shadow-emerald-50'
                              : 'bg-slate-50 text-slate-500 border-transparent hover:border-slate-100'
                          }`}
                        >
                          <span className="text-[8px] font-black uppercase tracking-widest opacity-70">{option.day}</span>
                          <span className="text-xs font-black">{option.date.split(' ')[0]}</span>
                          <span className="text-[8px] font-black uppercase tracking-widest opacity-70">{option.date.split(' ')[1]}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-2 text-sm font-medium text-slate-400">
                      {availabilityError || 'No available dates for this specialist.'}
                    </div>
                  )}
                </div>

                <div className="space-y-6 mb-10">
                  <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-widest px-2">Available Time Slots</h4>
                  {loadingAvailability ? (
                    <div className="px-2 text-sm font-medium text-slate-400">Loading time slots...</div>
                  ) : slotsForSelectedDate.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 px-2">
                      {slotsForSelectedDate.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={`px-4 py-4 rounded-2xl text-[10px] font-black transition-all border-2 ${
                            selectedSlotId === slot.id
                              ? 'bg-[#76A13B] text-white border-[#76A13B] shadow-lg shadow-emerald-50'
                              : 'bg-slate-50 text-slate-500 border-transparent hover:border-slate-100'
                          }`}
                        >
                          {formatSlotRange(slot)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-2 text-sm font-medium text-slate-400">
                      {selectedDateKey ? 'No open slots for this date.' : 'Choose a date to see time slots.'}
                    </div>
                  )}
                </div>

                <div className="space-y-4 mb-10">
                  <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-widest px-2">Communication Mode</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {(['Text', 'Audio', 'Video'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setSelectedMode(mode)}
                        className={`flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all group active:scale-95 ${
                          selectedMode === mode
                            ? 'border-[#76A13B] bg-[#76A13B]/10'
                            : 'bg-slate-50 border-transparent hover:border-[#76A13B] hover:bg-[#76A13B]/10'
                        }`}
                      >
                        <div className={`transition-colors ${
                          selectedMode === mode ? 'text-[#76A13B]' : 'text-slate-400 group-hover:text-[#76A13B]'
                        }`}>
                          {mode === 'Text' ? <MessageIcon /> : mode === 'Audio' ? <CallCenterIcon className="w-5 h-5" /> : <VideoIcon />}
                        </div>
                        <span className={`text-[10px] font-black uppercase ${
                          selectedMode === mode ? 'text-[#76A13B]' : 'text-slate-500 group-hover:text-[#76A13B]'
                        }`}>{mode}</span>
                      </button>
                    ))}
                  </div>

                  {selectedMode && selectedSlot && (
                    <div className="mx-2 mt-4 p-6 bg-slate-900 rounded-[2rem] flex items-center justify-between text-white">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Booking Summary</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black px-2 py-0.5 bg-[#76A13B] rounded-lg tracking-widest">{selectedMode}</span>
                          <span className="text-[10px] font-black text-slate-300">{formatDateOption(selectedSlot.date).full}</span>
                        </div>
                        <span className="mt-2 text-xs font-black">{formatSlotRange(selectedSlot)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black">{selectedPro.fee} <span className="text-[10px] text-slate-400 font-bold uppercase">ETB</span></span>
                      </div>
                    </div>
                  )}
                </div>

                {bookingError && (
                  <p className="px-2 pb-4 text-sm font-medium text-rose-500">{bookingError}</p>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={resetBookingState}
                    className="flex-1 py-5 text-slate-400 font-black uppercase text-xs tracking-widest"
                  >
                    Back
                  </button>
                  <Button
                    color="purple"
                    size="lg"
                    className="flex-[2]"
                    disabled={!selectedSlot || !selectedMode || loadingAvailability}
                    onClick={() => setBookingStep('payment')}
                  >
                    Confirm & Book
                  </Button>
                </div>
              </>
            ) : (
              <div className="animate-in fade-in zoom-in duration-300">
                <div className="text-center mb-10">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-3xl">💳</div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2">Payment Details</h3>
                  <p className="text-slate-500 text-sm font-medium">
                    Please complete the payment for <span className="font-black text-slate-800">{selectedPro.fee} ETB</span> to secure your slot on{' '}
                    <span className="text-[#76A13B] font-black">{selectedSlot ? formatDateOption(selectedSlot.date).full : ''}</span> at{' '}
                    <span className="text-[#76A13B] font-black">{selectedSlot ? selectedSlot.startTime : ''}</span>.
                  </p>
                </div>

                <div className="space-y-4 mb-12">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank - CBE</span>
                    </div>
                    <p className="text-lg font-black text-slate-800 mb-1">1000123456789</p>
                    <p className="text-[10px] font-black text-[#76A13B] uppercase tracking-widest">LIJE CARE TECHNOLOGIES</p>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile Money - Telebirr</span>
                    </div>
                    <p className="text-lg font-black text-slate-800 mb-1">+251 912 345 678</p>
                    <p className="text-[10px] font-black text-[#76A13B] uppercase tracking-widest">LIJE CARE SERVICES</p>
                  </div>
                </div>

                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 mb-10">
                  <p className="text-[10px] text-amber-700 font-bold leading-relaxed text-center">
                    Please upload your transaction screenshot or send the transaction ID to our Telegram support after payment, then return and close this booking flow.
                  </p>
                </div>

                {bookingError && (
                  <p className="px-2 pb-4 text-sm font-medium text-rose-500">{bookingError}</p>
                )}

                <div className="flex flex-col gap-4 mb-10">
                  <a
                    href="https://t.me/lijecare_support"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-5 bg-sky-500 text-white font-black rounded-3xl shadow-xl shadow-sky-100 flex items-center justify-center gap-2 active:scale-95 transition-transform uppercase text-xs tracking-widest"
                  >
                    Upload Payment (Telegram)
                  </a>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setBookingStep('selection')}
                    className="flex-1 py-5 text-slate-400 font-black uppercase text-xs tracking-widest"
                  >
                    Change Info
                  </button>
                  <button
                    onClick={() => {
                      void handleBookConsultation();
                    }}
                    className="flex-[2] py-5 bg-[#0B1A12] text-white font-black rounded-3xl shadow-2xl shadow-emerald-200 active:scale-95 transition-transform uppercase text-xs tracking-widest"
                  >
                    Done / Close
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </BottomSheet>
    </div>
  );
};

export default CallCenterView;
