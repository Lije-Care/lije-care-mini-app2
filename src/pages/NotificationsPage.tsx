import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import api from '@/api/axios';
import { ChevronLeftIcon } from '@/design-system/icons';
import i18n from '@/i18n/i18n';
import { fetchChildrenByParentId } from '@/redux/slices/childSlice';
import { fetchAllNotifications } from '@/redux/slices/notificationSlice';
import type { AppDispatch, RootState } from '@/redux/store';

type AnthropometricAssessmentId = 'a1' | 'a1-2' | 'a1-3' | 'a1-4' | 'a1-5';

interface ExpiredMeasurementItem {
  id: AnthropometricAssessmentId;
  title: string;
  isRecorded: boolean;
  statusText: string;
}

interface VaccineAlertItem {
  id: string;
  name: string;
  dueDate: string;
  isMissed: boolean;
  isUpcomingReminder: boolean;
  canCheck: boolean;
}

const STALE_CUTOFF_DAYS = 30;

const formatRelativeTime = (isoDate?: string) => {
  if (!isoDate) return i18n.t('Never updated');

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return i18n.t('Unknown');

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return i18n.t('Updated today');
  if (diffDays === 1) return i18n.t('Updated 1 day ago');
  if (diffDays < 7) return i18n.t('Updated {{count}} days ago', { count: diffDays });

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) {
    return i18n.t(diffWeeks > 1 ? 'Updated {{count}} weeks ago' : 'Updated {{count}} week ago', {
      count: diffWeeks,
    });
  }

  const diffMonths = Math.floor(diffDays / 30);
  return i18n.t(diffMonths > 1 ? 'Updated {{count}} months ago' : 'Updated {{count}} month ago', {
    count: diffMonths,
  });
};

const toStatusText = (lastUpdatedText: string, isRecorded: boolean) => {
  if (!isRecorded) return i18n.t('Not recorded yet');
  return i18n.t('Outdated status', {
    value: lastUpdatedText.replace(/^Updated\s+/i, '').toUpperCase(),
  });
};

const NotificationsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [vaccineAlerts, setVaccineAlerts] = useState<VaccineAlertItem[]>([]);
  const [isLoadingVaccineAlerts, setIsLoadingVaccineAlerts] = useState(false);

  const childrenState = useSelector((state: RootState) => state.children);
  const notificationsState = useSelector((state: RootState) => state.notificartions);

  const favoriteChildId =
    typeof window !== 'undefined' ? localStorage.getItem('favorite_child_id') : null;
  const activeChild =
    childrenState.data.find((child) => child.id === favoriteChildId) || childrenState.data[0];

  useEffect(() => {
    if (childrenState.data.length === 0) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser?.id) {
          dispatch(fetchChildrenByParentId(parsedUser.id));
        }
      }
    }
  }, [childrenState.data.length, dispatch]);

  useEffect(() => {
    dispatch(fetchAllNotifications());
  }, [dispatch]);

  useEffect(() => {
    let isMounted = true;

    const fetchVaccineAlerts = async () => {
      if (!activeChild?.id) {
        if (isMounted) {
          setVaccineAlerts([]);
          setIsLoadingVaccineAlerts(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setIsLoadingVaccineAlerts(true);
        }
        const response = await api.get<{ data: VaccineAlertItem[] }>(
          `/immunity/children/${activeChild.id}/schedule`
        );
        if (!isMounted) return;

        const nextAlerts = (response.data.data || []).filter(
          (item) => item.isMissed || item.isUpcomingReminder || item.canCheck
        );
        setVaccineAlerts(nextAlerts);
      } catch {
        if (isMounted) {
          setVaccineAlerts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingVaccineAlerts(false);
        }
      }
    };

    void fetchVaccineAlerts();

    return () => {
      isMounted = false;
    };
  }, [activeChild?.id]);

  const expiredMeasurements = useMemo<ExpiredMeasurementItem[]>(() => {
    const updatedAt = activeChild?.updatedAt;
    const diffDays = updatedAt
      ? Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24))
      : Number.POSITIVE_INFINITY;
    const isStale = !Number.isFinite(diffDays) || diffDays > STALE_CUTOFF_DAYS;
    const lastUpdatedText = formatRelativeTime(updatedAt);

    const items: ExpiredMeasurementItem[] = [
      {
        id: 'a1',
        title: 'Weight for Height',
        isRecorded: Boolean(activeChild?.weight && activeChild?.height),
        statusText: toStatusText(lastUpdatedText, Boolean(activeChild?.weight && activeChild?.height)),
      },
      {
        id: 'a1-2',
        title: 'Height for Age',
        isRecorded: Boolean(activeChild?.height),
        statusText: toStatusText(lastUpdatedText, Boolean(activeChild?.height)),
      },
      {
        id: 'a1-3',
        title: 'MUAC for Age',
        isRecorded: Boolean(activeChild?.muac),
        statusText: toStatusText(lastUpdatedText, Boolean(activeChild?.muac)),
      },
      {
        id: 'a1-4',
        title: 'BMI for Age',
        isRecorded: Boolean(activeChild?.weight && activeChild?.height),
        statusText: toStatusText(lastUpdatedText, Boolean(activeChild?.weight && activeChild?.height)),
      },
      {
        id: 'a1-5',
        title: 'Weight for Age',
        isRecorded: Boolean(activeChild?.weight),
        statusText: toStatusText(lastUpdatedText, Boolean(activeChild?.weight)),
      },
    ];

    return items.filter((item) => !item.isRecorded || isStale);
  }, [activeChild?.height, activeChild?.muac, activeChild?.updatedAt, activeChild?.weight]);

  return (
    <div className="min-h-full bg-[#f7f7f4]">
      <div className="border-b border-slate-200/80 bg-white px-6 py-6">
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"
            aria-label={t('Go back')}
          >
            <ChevronLeftIcon size={22} />
          </button>
          <h1 className="text-center text-[1.9rem] font-black tracking-tight text-slate-800">
            {t('Notifications')}
          </h1>
        </div>
      </div>

      <div className="space-y-10 px-6 py-10">
        <section>
          <h2 className="mb-8 text-[1.8rem] font-black tracking-tight text-slate-800">
            {t('Expired Measurements')}
          </h2>

          {childrenState.loading && childrenState.data.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-8 text-center text-sm font-semibold text-slate-500">
              {t('Loading measurements...')}
            </div>
          ) : expiredMeasurements.length > 0 ? (
            <div className="space-y-5">
              {expiredMeasurements.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-[2rem] border border-[#f0d36e] bg-[#fcf8e8] px-6 py-6 shadow-[0_8px_20px_rgba(15,23,42,0.03)]"
                >
                  <div className="pr-4">
                    <h3 className="text-[1.35rem] font-black tracking-tight text-slate-800">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-amber-600">
                      {item.statusText}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate('/assessment', {
                        state: {
                          openMeasurementId: item.id,
                        },
                      })
                    }
                    className="rounded-[1.1rem] border border-[#f0d36e] bg-white px-5 py-3 text-sm font-black text-amber-600 shadow-sm transition-transform active:scale-[0.98]"
                  >
                    {t('Update')}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-emerald-100 bg-white px-6 py-8 text-center">
              <p className="text-lg font-black text-slate-800">{t('All measurements are up to date.')}</p>
              <p className="mt-2 text-sm font-medium text-slate-500">
                {t('There is nothing to update right now.')}
              </p>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-8 text-[1.8rem] font-black tracking-tight text-slate-800">
            {t('Vaccination Alerts')}
          </h2>

          {isLoadingVaccineAlerts ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-8 text-center text-sm font-semibold text-slate-500">
              {t('Loading vaccine alerts...')}
            </div>
          ) : vaccineAlerts.length > 0 ? (
            <div className="space-y-5">
              {vaccineAlerts.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between rounded-[2rem] border px-6 py-6 shadow-[0_8px_20px_rgba(15,23,42,0.03)] ${
                    item.isMissed
                      ? 'border-rose-100 bg-rose-50'
                      : 'border-amber-100 bg-[#fff8ea]'
                  }`}
                >
                  <div className="pr-4">
                    <h3 className="text-[1.35rem] font-black tracking-tight text-slate-800">
                      {item.name}
                    </h3>
                    <p
                      className={`mt-1 text-xs font-black uppercase tracking-[0.12em] ${
                        item.isMissed ? 'text-rose-600' : 'text-amber-600'
                      }`}
                    >
                      {item.isMissed
                        ? `${t('Not given')} • ${new Date(item.dueDate).toLocaleDateString(i18n.language === 'am' ? 'am-ET' : 'en-US', {
                            month: 'numeric',
                            day: 'numeric',
                            year: 'numeric',
                          })}`
                        : item.canCheck
                          ? `${t('Due now')} • ${new Date(item.dueDate).toLocaleDateString(i18n.language === 'am' ? 'am-ET' : 'en-US', {
                              month: 'numeric',
                              day: 'numeric',
                              year: 'numeric',
                            })}`
                          : `${t('Due within 7 days')} • ${new Date(item.dueDate).toLocaleDateString(i18n.language === 'am' ? 'am-ET' : 'en-US', {
                              month: 'numeric',
                              day: 'numeric',
                              year: 'numeric',
                            })}`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate('/assessment', {
                        state: {
                          focusSection: 'vaccine',
                        },
                      })
                    }
                    className="rounded-[1.1rem] border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition-transform active:scale-[0.98]"
                  >
                    {t('View')}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-emerald-100 bg-white px-6 py-8 text-center">
              <p className="text-lg font-black text-slate-800">{t('No vaccine alerts right now.')}</p>
              <p className="mt-2 text-sm font-medium text-slate-500">
                {t('Upcoming reminders and missed vaccines will appear here.')}
              </p>
            </div>
          )}
        </section>

        {notificationsState.data.length > 0 && (
          <section>
            <h2 className="mb-5 text-[1.35rem] font-black tracking-tight text-slate-800">
              {t('System Updates')}
            </h2>
            <div className="space-y-4">
              {notificationsState.data.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-[1.75rem] border border-slate-200 bg-white px-5 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.03)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-black text-slate-800">
                        {notification.title || t('Notification')}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {notification.message}
                      </p>
                    </div>
                    {notification.type && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                        {notification.type.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
