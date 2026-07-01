import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import api from '@/api/axios';
import { AppDispatch, RootState } from '@/redux/store';
import { fetchSpecialists } from '@/redux/slices/specialistSlice';
import { StarIcon, VideoIcon, MessageIcon, CallCenterIcon } from '@/design-system/icons';
import { BottomSheet, Button } from '@/components/ui';
import type { Professional } from '@/design-system/types';
import type { AvailabilitySlot } from '@/types/specialist';
import type { Booking } from '@/types/booking';
import type { ConsultationOrder } from '@/types/consultationOrder';
import i18n from '@/i18n/i18n';
import {
  compareConsultationSlots,
  getBookingSessionWindowState,
  isFutureConsultationSlot,
} from '@/utils/consultationTime';

const getDateKey = (isoDate: string) => isoDate.split('T')[0];

/** Map frontend mode labels to backend ConsultationType enum values */
const MODE_TO_CONSULTATION_TYPE: Record<'Text' | 'Audio' | 'Video', string> = {
  Text: 'TEXT',
  Audio: 'AUDIO',
  Video: 'VIDEO',
};

/** Return the correct fee for the selected mode, falling back to the general fee */
const getPriceForMode = (
  pro: Professional,
  mode: 'Text' | 'Audio' | 'Video' | null,
): number => {
  if (mode === 'Text') return pro.textFee ?? pro.fee;
  if (mode === 'Audio') return pro.callFee ?? pro.fee;
  if (mode === 'Video') return pro.videoFee ?? pro.fee;
  return pro.fee;
};

/** Lowest price across all configured consultation types — used on the expert card */
const getStartingFee = (pro: Professional): { amount: number; hasRange: boolean } => {
  const configured = ([pro.textFee, pro.callFee, pro.videoFee] as Array<number | null | undefined>)
    .filter((f): f is number => f != null);
  if (configured.length === 0) return { amount: pro.fee, hasRange: false };
  const min = Math.min(...configured);
  const max = Math.max(...configured, pro.fee);
  return { amount: min, hasRange: min !== max };
};

/** Map backend ConsultationOrder status values to user-facing labels */
const getOrderStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    PENDING_ADMIN_CONFIRMATION: i18n.t('Waiting for approval'),
    CONFIRMED: i18n.t('Approved'),
    REJECTED: i18n.t('Rejected'),
  };
  return labels[status] ?? status;
};

// Support contact — mirrors the VITE_SHOP_ORDER_PHONE pattern used in ShopView.
const SUPPORT_PHONE: string = (import.meta.env.VITE_SUPPORT_PHONE as string | undefined) ?? '';
const SUPPORT_AGENT_ID: string = (import.meta.env.VITE_SUPPORT_AGENT_ID as string | undefined) ?? '';

const parseCalendarDate = (isoDate: string) => {
  const [year = '1970', month = '01', day = '01'] = getDateKey(isoDate).split('-');
  return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
};

const formatDateOption = (isoDate: string) => {
  const date = parseCalendarDate(isoDate);
  return {
    id: getDateKey(isoDate),
    full: date.toLocaleDateString(i18n.language === 'am' ? 'am-ET' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    day: date.toLocaleDateString(i18n.language === 'am' ? 'am-ET' : 'en-US', {
      weekday: 'short',
    }),
    date: date.toLocaleDateString(i18n.language === 'am' ? 'am-ET' : 'en-US', {
      day: 'numeric',
      month: 'short',
    }),
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

const CONSULTATION_TYPE_TO_MODE: Record<'TEXT' | 'AUDIO' | 'VIDEO', 'Text' | 'Audio' | 'Video'> = {
  TEXT: 'Text',
  AUDIO: 'Audio',
  VIDEO: 'Video',
};

const getActionAvailability = (
  order: ConsultationOrder | undefined,
  booking: Pick<Booking, 'slot' | 'consultationTimeZone' | 'sessionWindowState'>,
  actionType: 'TEXT' | 'AUDIO' | 'VIDEO',
) => {
  if (!order) {
    return { enabled: false, reason: 'Consultation details unavailable' };
  }

  if (order.status === 'PENDING_ADMIN_CONFIRMATION') {
    return { enabled: false, reason: 'This consultation is awaiting approval.' };
  }

  if (order.status === 'REJECTED') {
    return { enabled: false, reason: 'This consultation was rejected.' };
  }

  if (order.consultationType !== actionType) {
    return { enabled: false, reason: 'This action is not included in the booked consultation type.' };
  }

  const windowState = getBookingSessionWindowState(booking);
  if (windowState === 'upcoming') {
    return { enabled: false, reason: 'This consultation will open when the booked time starts.' };
  }

  if (windowState === 'ended') {
    return { enabled: false, reason: 'This consultation time has ended.' };
  }

  if (windowState !== 'active') {
    return { enabled: false, reason: 'This consultation is unavailable right now.' };
  }

  return { enabled: true, reason: '' };
};

const CallCenterView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
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
  const [consultationOrders, setConsultationOrders] = useState<ConsultationOrder[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [uploadingOrder, setUploadingOrder] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Get specialists from Redux
  const { specialists, loading } = useSelector((state: RootState) => state.specialists);

  useEffect(() => {
    dispatch(fetchSpecialists({ page: 1, limit: 10 }));
  }, [dispatch]);

  useEffect(() => {
    const requestedTab = (location.state as { activeTab?: 'Doctor' | 'Nutritionist' | 'Support' | 'Sessions' } | null)?.activeTab;
    if (!requestedTab || requestedTab === activeTab) return;

    setActiveTab(requestedTab);
    navigate(location.pathname, { replace: true, state: null });
  }, [activeTab, location.pathname, location.state, navigate]);

  const fetchBookings = async () => {
    const telegramUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!telegramUser?.id) {
      setBookings([]);
      setConsultationOrders([]);
      setSessionsError(t('User not found'));
      return;
    }

    try {
      setLoadingSessions(true);
      setSessionsError(null);

      // Fetch bookings and consultation orders in parallel so one failing doesn't block the other
      const [bookingsRes, ordersRes] = await Promise.allSettled([
        api.get(`/booking/my-booking/parent/${telegramUser.id}`),
        api.get(`/consultation-order/my-orders/${telegramUser.id}`),
      ]);

      setBookings(
        bookingsRes.status === 'fulfilled' ? bookingsRes.value.data?.data ?? [] : [],
      );
      setConsultationOrders(
        ordersRes.status === 'fulfilled' ? ordersRes.value.data ?? [] : [],
      );

      if (bookingsRes.status === 'rejected') {
        const err = bookingsRes.reason as any;
        setSessionsError(err?.response?.data?.message || t('Failed to load bookings'));
      }
    } catch (error: any) {
      setSessionsError(error.response?.data?.message || t('Failed to load bookings'));
      setBookings([]);
      setConsultationOrders([]);
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
      name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || t('Specialist'),
      title: s.SpecialistProfile?.specialty || roleToType(s.role),
      type: roleToType(s.role),
      image: s.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.id}`,
      availability: t('Available for booking'),
      rating: 4.8, // Backend doesn't have rating, using default
      fee: Number(s.SpecialistProfile?.consultationFee ?? 0),
      textFee: s.SpecialistProfile?.textPrice != null ? Number(s.SpecialistProfile.textPrice) : null,
      callFee: s.SpecialistProfile?.callPrice != null ? Number(s.SpecialistProfile.callPrice) : null,
      videoFee: s.SpecialistProfile?.videoCallPrice != null ? Number(s.SpecialistProfile.videoCallPrice) : null,
      specialty: s.SpecialistProfile?.specialty || t('Child Care'),
    };
  });

  const availableSlots = availabilitySlots
    .filter((slot) => !slot.isBooked && slot.startTime && slot.date && isFutureConsultationSlot(slot))
    .sort(compareConsultationSlots);

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
        .filter((slot) => !slot.isBooked && slot.startTime && slot.date && isFutureConsultationSlot(slot))
        .sort(compareConsultationSlots);

      setAvailabilitySlots(nextAvailableSlots);
      setBookingStep('selection');
      setSelectedDateKey(nextAvailableSlots[0] ? getDateKey(nextAvailableSlots[0].date) : '');
    } catch (error: any) {
      setAvailabilitySlots([]);
      setSelectedDateKey('');
      setAvailabilityError(error.response?.data?.message || t('Unable to load availability right now.'));
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
    setScreenshotFile(null);
    setUploadingOrder(false);
    setSubmissionSuccess(false);
  };

  useEffect(() => {
    if (selectedPro) {
      fetchAvailability(selectedPro.id);
    }
  }, [selectedPro]);

  useEffect(() => {
    setSelectedSlotId(null);
  }, [selectedDateKey]);

  const handleBookConsultation = async () => {
    if (!selectedPro || !selectedMode || !selectedSlot || !screenshotFile) return;

    const telegramUser = JSON.parse(localStorage.getItem('user') || '{}');
    const favoriteChildId = localStorage.getItem('favorite_child_id');

    if (!telegramUser?.id || !favoriteChildId) {
      setBookingError(t('Select an active child before booking a consultation.'));
      return;
    }

    try {
      setBookingError(null);
      setUploadingOrder(true);

      // 1. Reserve the availability slot
      const bookingRes = await api.post('/booking/create', {
        parentId: telegramUser.id,
        expertId: selectedPro.id,
        slotId: selectedSlot.id,
        childId: favoriteChildId,
      });
      const bookingId: string | undefined = bookingRes.data?.id;

      // 2. Upload payment screenshot
      const formData = new FormData();
      formData.append('image', screenshotFile);
      formData.append('type', 'PAYMENT_SCREENSHOT');
      const uploadRes = await api.post('/file-upload/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Backend stores only the filename in url (accessPath = ''), so construct
      // the correct full URL here using the API origin + known upload folder.
      const apiOrigin = new URL(import.meta.env.VITE_API_URL as string).origin;
      const fileName: string = uploadRes.data?.fileName ?? '';
      const paymentScreenshotUrl: string = fileName
        ? `${apiOrigin}/uploads/images/PAYMENT_SCREENSHOT/${fileName}`
        : (uploadRes.data?.url ?? '');

      // 3. Create consultation order with type + price snapshot
      await api.post('/consultation-order/create', {
        parentId: telegramUser.id,
        expertId: selectedPro.id,
        ...(bookingId ? { bookingId } : {}),
        consultationType: MODE_TO_CONSULTATION_TYPE[selectedMode],
        pricePaid: getPriceForMode(selectedPro, selectedMode),
        paymentScreenshotUrl,
      });

      await fetchBookings();
      // Show success message inside the sheet; the user closes it explicitly via "Close".
      setSubmissionSuccess(true);
    } catch (error: any) {
      setBookingError(error.response?.data?.message || t('Booking failed. Try again.'));
    } finally {
      setUploadingOrder(false);
    }
  };

  return (
    <div className="pb-32 pt-4">
      <div className="px-6 mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('Expert Care')}</h2>
          <p className="text-slate-500 text-sm">{t('Consult with verified child experts.')}</p>
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
          {t('My Sessions')}
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
            {t(type)}
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
            {t('← Back to Help')}
          </button>
          {loadingSessions ? (
            <div className="bg-slate-50 rounded-[3rem] p-12 text-center border border-slate-100">
              <p className="text-slate-400 font-medium">{t('Loading sessions...')}</p>
            </div>
          ) : sessionsError ? (
            <div className="bg-rose-50 rounded-[3rem] p-12 text-center border border-rose-100">
              <p className="text-rose-500 font-medium">{sessionsError}</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-slate-50 rounded-[3rem] p-12 text-center border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm">🗓️</div>
              <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest mb-2">{t('No Sessions Yet')}</h3>
              <p className="text-slate-400 text-xs font-medium">{t('Your booked consultations will appear here.')}</p>
            </div>
          ) : (
            bookings.map((booking) => {
              const order = consultationOrders.find(o => o.bookingId === booking.id);
              const sessionMode = order ? CONSULTATION_TYPE_TO_MODE[order.consultationType] : null;
              const windowState = getBookingSessionWindowState(booking);
              const isActive = windowState === 'active';
              const textAction = getActionAvailability(order, booking, 'TEXT');
              const audioAction = getActionAvailability(order, booking, 'AUDIO');
              const videoAction = getActionAvailability(order, booking, 'VIDEO');
              return (
                <div key={booking.id} className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden">
                  {isActive && (
                    <div className="absolute top-0 right-0 bg-[#76A13B] text-white px-4 py-1 text-[8px] font-black uppercase tracking-[0.2em] rounded-bl-2xl">
                      {t('Active Now')}
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
                      {order ? (
                        <p className={`text-[10px] font-black uppercase tracking-widest ${
                          order.status === 'CONFIRMED'
                            ? 'text-[#76A13B]'
                            : order.status === 'REJECTED'
                            ? 'text-rose-500'
                            : 'text-amber-500'
                        }`}>
                          {getOrderStatusLabel(order.status)}
                        </p>
                      ) : (
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{booking.status}</p>
                      )}
                      {sessionMode && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-1 bg-slate-100 rounded-lg text-[8px] font-black text-slate-500 uppercase tracking-widest">{t(sessionMode)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-8 px-2">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Date & Time')}</span>
                      <span className="text-xs font-black text-slate-700">
                        {formatDateOption(booking.slot.date).full} • {formatDisplayTime(booking.slot.startTime)} - {formatDisplayTime(booking.slot.endTime)}
                      </span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {windowState === 'active'
                        ? t('Active Now')
                        : windowState === 'upcoming'
                        ? t('Upcoming')
                        : windowState === 'ended'
                        ? t('Ended')
                        : t('Unavailable')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <button
                      disabled={!textAction.enabled}
                      onClick={() => navigate(`/chat/${booking.expert.id}?bookingId=${booking.id}&actionType=TEXT`)}
                      title={textAction.reason ? t(textAction.reason) : undefined}
                      className={`py-4 rounded-2xl flex items-center justify-center transition-all ${
                        textAction.enabled ? 'bg-[#0B1A12] text-white shadow-lg' : 'bg-slate-50 text-slate-200'
                      }`}
                    >
                      <MessageIcon />
                    </button>
                    <button
                      disabled={!audioAction.enabled}
                      onClick={() => navigate(`/session-call/${booking.expert.id}?bookingId=${booking.id}&actionType=AUDIO`)}
                      title={audioAction.reason ? t(audioAction.reason) : undefined}
                      className={`py-4 rounded-2xl flex items-center justify-center transition-all ${
                        audioAction.enabled ? 'bg-[#0B1A12] text-white shadow-lg' : 'bg-slate-50 text-slate-200'
                      }`}
                    >
                      <CallCenterIcon className="w-4 h-4" />
                    </button>
                    <button
                      disabled={!videoAction.enabled}
                      onClick={() => navigate(`/session-call/${booking.expert.id}?bookingId=${booking.id}&actionType=VIDEO`)}
                      title={videoAction.reason ? t(videoAction.reason) : undefined}
                      className={`py-4 rounded-2xl flex items-center justify-center transition-all ${
                        videoAction.enabled ? 'bg-[#0B1A12] text-white shadow-lg' : 'bg-slate-50 text-slate-200'
                      }`}
                    >
                      <VideoIcon />
                    </button>
                  </div>
                  {!textAction.enabled && sessionMode === 'Text' && (
                    <p className="mt-3 text-[10px] font-bold text-slate-400">{t(textAction.reason)}</p>
                  )}
                  {!audioAction.enabled && sessionMode === 'Audio' && (
                    <p className="mt-3 text-[10px] font-bold text-slate-400">{t(audioAction.reason)}</p>
                  )}
                  {!videoAction.enabled && sessionMode === 'Video' && (
                    <p className="mt-3 text-[10px] font-bold text-slate-400">{t(videoAction.reason)}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : activeTab === 'Support' ? (
        <div className="px-6 animate-in fade-in slide-in-from-bottom">
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-[#76A13B]/10 rounded-[2.5rem] flex items-center justify-center mb-8 text-4xl shadow-inner">🎧</div>
            <h3 className="text-2xl font-black text-slate-800 mb-3 leading-tight">{t('Instant App Help')}</h3>
            <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">{t('Talk to our customer success team for any technical or general app queries. No booking needed.')}</p>
            <div className="flex flex-col gap-4 w-full">
              {/* Instant Live Chat — navigates to the real chat screen with the support agent */}
              <Button
                color="purple"
                fullWidth
                size="lg"
                onClick={() => {
                  if (SUPPORT_AGENT_ID) {
                    navigate(`/chat/${SUPPORT_AGENT_ID}`);
                  } else {
                    alert(t('Live chat is not available right now. Please call us instead.'));
                  }
                }}
              >
                {t('Instant Live Chat')}
              </Button>

              {/* Emergency Audio Call — opens native phone dialer, same pattern as ShopView */}
              {SUPPORT_PHONE ? (
                <a
                  href={`tel:${SUPPORT_PHONE}`}
                  className="w-full py-4 text-lg bg-[#0B1A12] hover:bg-[#1B3B2B] text-white font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-slate-300"
                >
                  {t('Emergency Audio Call')}
                </a>
              ) : (
                <p className="text-center text-sm text-slate-400">
                  {t('Call support — contact not configured (set VITE_SUPPORT_PHONE)')}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : loading && professionals.length === 0 ? (
        <div className="px-6 py-12 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#76A13B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 font-medium">{t('Loading specialists...')}</p>
          </div>
        </div>
      ) : professionals.filter(p => p.type === activeTab).length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="w-20 h-20 bg-[#76A13B]/10 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👨‍⚕️</span>
          </div>
          <p className="text-slate-600 font-bold mb-2">{t('No {{type}}s Available', { type: t(activeTab) })}</p>
          <p className="text-slate-400 text-sm">{t('Please check back later for available specialists.')}</p>
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
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Session Fee')}</span>
                  <span className="text-xl font-black text-slate-900">
                    {getStartingFee(pro).amount} <span className="text-[10px] font-bold">ETB</span>
                  </span>
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
                  {t('Check Availability')}
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
                    {loadingAvailability ? t('Loading availability...') : t('Open slots: {{count}}', { count: availableSlots.length })}
                  </div>
                </div>

                <div className="space-y-6 mb-10">
                  <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-widest px-2">{t('Select Date')}</h4>
                  {loadingAvailability ? (
                    <div className="px-2 text-sm font-medium text-slate-400">{t('Loading available dates...')}</div>
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
                      {availabilityError || t('No available dates for this specialist.')}
                    </div>
                  )}
                </div>

                <div className="space-y-6 mb-10">
                  <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-widest px-2">{t('Available Time Slots')}</h4>
                  {loadingAvailability ? (
                    <div className="px-2 text-sm font-medium text-slate-400">{t('Loading time slots...')}</div>
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
                      {selectedDateKey ? t('No open slots for this date.') : t('Choose a date to see time slots.')}
                    </div>
                  )}
                </div>

                <div className="space-y-4 mb-10">
                  <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-widest px-2">{t('Communication Mode')}</h4>
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
                        }`}>{t(mode)}</span>
                        <span className={`text-[9px] font-bold ${
                          selectedMode === mode ? 'text-[#76A13B]' : 'text-slate-400'
                        }`}>
                          {getPriceForMode(selectedPro, mode)} ETB
                        </span>
                      </button>
                    ))}
                  </div>

                  {selectedMode && selectedSlot && (
                    <div className="mx-2 mt-4 p-6 bg-slate-900 rounded-[2rem] flex items-center justify-between text-white">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{t('Booking Summary')}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black px-2 py-0.5 bg-[#76A13B] rounded-lg tracking-widest">{t(selectedMode)}</span>
                          <span className="text-[10px] font-black text-slate-300">{formatDateOption(selectedSlot.date).full}</span>
                        </div>
                        <span className="mt-2 text-xs font-black">{formatSlotRange(selectedSlot)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black">{getPriceForMode(selectedPro, selectedMode)} <span className="text-[10px] text-slate-400 font-bold uppercase">ETB</span></span>
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
                    {t('Back')}
                  </button>
                  <Button
                    color="purple"
                    size="lg"
                    className="flex-[2]"
                    disabled={!selectedSlot || !selectedMode || loadingAvailability}
                    onClick={() => setBookingStep('payment')}
                  >
                    {t('Confirm & Book')}
                  </Button>
                </div>
              </>
            ) : (
              <div className="animate-in fade-in zoom-in duration-300">
                {submissionSuccess ? (
                  /* ── Success state ── */
                  <div className="flex flex-col items-center text-center py-8">
                    <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-6 text-5xl shadow-inner">
                      ✅
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-3">{t('Submitted!')}</h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10 px-2">
                      {t('Payment screenshot submitted successfully.')} {' '}
                      <span className="font-black text-slate-700">{t('Your booking is awaiting approval.')}</span>
                    </p>
                    <div className="bg-amber-50 p-5 rounded-3xl border border-amber-100 mb-10 w-full">
                      <p className="text-[10px] text-amber-700 font-bold leading-relaxed text-center">
                        {t('Our team will review your payment and confirm your session shortly.')}
                      </p>
                    </div>
                    <button
                      onClick={resetBookingState}
                      className="w-full py-5 bg-[#0B1A12] text-white font-black rounded-3xl shadow-xl shadow-emerald-200 active:scale-95 transition-transform uppercase text-xs tracking-widest"
                    >
                      {t('Close')}
                    </button>
                  </div>
                ) : (
                  /* ── Normal payment upload state ── */
                  <>
                    <div className="text-center mb-10">
                      <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-3xl">💳</div>
                      <h3 className="text-2xl font-black text-slate-800 mb-2">{t('Payment Details')}</h3>
                      <p className="text-slate-500 text-sm font-medium">
                        {t(
                          'Please complete the payment for {{amount}} ETB to secure your slot on {{date}} at {{time}}.',
                          {
                            amount: getPriceForMode(selectedPro, selectedMode),
                            date: selectedSlot ? formatDateOption(selectedSlot.date).full : '',
                            time: selectedSlot ? selectedSlot.startTime : '',
                          }
                        )}
                      </p>
                    </div>

                    <div className="space-y-4 mb-12">
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Bank - CBE')}</span>
                        </div>
                        <p className="text-lg font-black text-slate-800 mb-1">1000123456789</p>
                        <p className="text-[10px] font-black text-[#76A13B] uppercase tracking-widest">LIJE CARE TECHNOLOGIES</p>
                      </div>

                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Mobile Money - Telebirr')}</span>
                        </div>
                        <p className="text-lg font-black text-slate-800 mb-1">+251 912 345 678</p>
                        <p className="text-[10px] font-black text-[#76A13B] uppercase tracking-widest">LIJE CARE SERVICES</p>
                      </div>
                    </div>

                    {/* Payment screenshot upload */}
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 mb-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                        {t('Payment Screenshot')} <span className="text-rose-400">*</span>
                      </p>
                      <label className="flex flex-col items-center gap-3 cursor-pointer">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          className="hidden"
                          onChange={(e) => setScreenshotFile(e.target.files?.[0] ?? null)}
                        />
                        {screenshotFile ? (
                          <div className="w-full flex items-center justify-between gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                            <span className="text-sm font-bold text-emerald-700 truncate">{screenshotFile.name}</span>
                            <span className="flex-shrink-0 text-[10px] font-black text-emerald-500 bg-emerald-100 px-2 py-0.5 rounded-lg">
                              {(screenshotFile.size / 1024).toFixed(0)} KB
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 py-4 text-slate-400">
                            <span className="text-3xl">📎</span>
                            <span className="text-xs font-bold">{t('Tap to attach screenshot')}</span>
                            <span className="text-[10px]">{t('JPEG or PNG · max 2 MB')}</span>
                          </div>
                        )}
                      </label>
                    </div>

                    <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 mb-10">
                      <p className="text-[10px] text-amber-700 font-bold leading-relaxed text-center">
                        {t('Attach your payment screenshot above, then tap')} <strong>{t('Done')}</strong>. {t('Your booking will be reviewed by our team.')}
                      </p>
                    </div>

                    {bookingError && (
                      <p className="px-2 pb-4 text-sm font-medium text-rose-500">{bookingError}</p>
                    )}

                    {/* Three-action row: Change Info · Close · Done */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setBookingStep('selection')}
                        className="flex-1 py-5 text-slate-400 font-black uppercase text-[10px] tracking-widest"
                      >
                        {t('Change Info')}
                      </button>
                      {/* Close — dismisses the sheet without submitting anything */}
                      <button
                        onClick={resetBookingState}
                        className="flex-1 py-5 border-2 border-slate-200 text-slate-500 font-black rounded-3xl uppercase text-[10px] tracking-widest active:scale-95 transition-transform"
                      >
                        {t('Close')}
                      </button>
                      {/* Done — submits the screenshot; disabled until a file is chosen or while loading */}
                      <button
                        onClick={() => { void handleBookConsultation(); }}
                        disabled={uploadingOrder || !screenshotFile}
                        className={`flex-[2] py-5 bg-[#0B1A12] text-white font-black rounded-3xl shadow-xl shadow-emerald-200 transition-transform uppercase text-[10px] tracking-widest ${
                          uploadingOrder || !screenshotFile
                            ? 'opacity-40 cursor-not-allowed'
                            : 'active:scale-95'
                        }`}
                      >
                        {uploadingOrder ? t('Submitting...') : t('Done')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </BottomSheet>
    </div>
  );
};

export default CallCenterView;
