import React from 'react';
import { useTranslation } from 'react-i18next';

import { BellIcon, InfoIcon, PlusIcon } from '@/design-system/icons';
import type { AnthropometricTone } from '@/utils/anthropometric';
import type { AnthropometricCard } from '@/utils/anthropometricCards';

export const STATUS_STYLES: Record<
  AnthropometricTone,
  {
    icon: string;
    pill: string;
  }
> = {
  danger: {
    icon: 'border-rose-100 bg-rose-50 text-rose-500',
    pill: 'border-rose-200 bg-rose-50 text-rose-500',
  },
  success: {
    icon: 'border-emerald-100 bg-emerald-50 text-emerald-500',
    pill: 'border-emerald-200 bg-emerald-50 text-emerald-500',
  },
  warning: {
    icon: 'border-amber-100 bg-amber-50 text-amber-600',
    pill: 'border-amber-200 bg-amber-50 text-amber-600',
  },
  neutral: {
    icon: 'border-slate-200 bg-slate-100 text-slate-400',
    pill: 'border-slate-200 bg-slate-100 text-slate-500',
  },
};

export const toOutdatedText = (lastUpdatedText: string, isRecorded: boolean, t: (key: string, options?: any) => string) => {
  if (!isRecorded) return t('Not recorded yet');
  return t('Outdated status', {
    value: lastUpdatedText.replace(/^Updated\s+/i, ''),
  });
};

export const StatusIcon: React.FC<{
  tone: AnthropometricTone;
  size?: 'sm' | 'md';
}> = ({ tone, size = 'md' }) => {
  const styles = STATUS_STYLES[tone];
  const containerClass = size === 'sm' ? 'h-20 w-20 rounded-[1.5rem]' : 'h-16 w-16 rounded-2xl';
  const iconClass = size === 'sm' ? 'text-4xl' : 'text-3xl';
  const icon =
    tone === 'success' ? '😊' : tone === 'neutral' ? '🙂' : tone === 'warning' ? '😐' : '😟';

  return (
    <div
      className={`flex ${containerClass} items-center justify-center border shadow-inner ${styles.icon}`}
      aria-hidden="true"
    >
      <span className={iconClass}>{icon}</span>
    </div>
  );
};

interface EmptyState {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface AnthropometricAssessmentSectionProps {
  cards: AnthropometricCard[];
  title: string;
  titleClassName?: string;
  headerClassName?: string;
  listClassName?: string;
  cardClassName?: string;
  alertCount?: number;
  actionLabel?: string;
  onActionClick?: () => void;
  onAlertClick?: () => void;
  onCardClick?: (card: AnthropometricCard) => void;
  onHelpClick?: (card: AnthropometricCard) => void;
  onAddDataClick?: (card: AnthropometricCard) => void;
  isLoading?: boolean;
  loadingTitle?: string;
  loadingDescription?: string;
  emptyState?: EmptyState | null;
}

const AnthropometricAssessmentSection: React.FC<AnthropometricAssessmentSectionProps> = ({
  cards,
  title,
  titleClassName = 'text-sm font-black uppercase tracking-widest text-slate-700',
  headerClassName = 'mb-4 flex items-center justify-between px-6',
  listClassName = 'hide-scrollbar flex gap-5 overflow-x-auto px-6 snap-x snap-mandatory',
  cardClassName = 'w-[19rem]',
  alertCount = 0,
  actionLabel,
  onActionClick,
  onAlertClick,
  onCardClick,
  onHelpClick,
  onAddDataClick,
  isLoading = false,
  loadingTitle,
  loadingDescription,
  emptyState,
}) => {
  const { t } = useTranslation();

  return (
    <section>
      <div className={headerClassName}>
        <h3 className={titleClassName}>{title}</h3>

        <div className="flex items-center gap-3">
          {actionLabel && onActionClick && (
            <button
              type="button"
              onClick={onActionClick}
              className="text-sm font-bold text-sky-600 transition-colors hover:text-sky-700"
            >
              {actionLabel}
            </button>
          )}

          {onAlertClick && (
            <button
              type="button"
              onClick={onAlertClick}
              className="relative rounded-xl border border-slate-100 bg-white p-2 text-slate-400 shadow-sm transition-colors hover:text-sky-500"
            >
              <BellIcon className="h-5 w-5" />
              {alertCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-[8px] font-black text-white">
                  {alertCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className={headerClassName.replace('items-center justify-between', '')}>
          <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-8 text-center">
            <p className="font-bold text-slate-700">
              {loadingTitle || t('Loading anthropometric assessment...')}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {loadingDescription || t("We're checking the latest growth measurements for this child.")}
            </p>
          </div>
        </div>
      ) : emptyState ? (
        <div className={headerClassName.replace('items-center justify-between', '')}>
          <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-8 text-center">
            <p className="font-bold text-slate-700">{emptyState.title}</p>
            {emptyState.description && (
              <p className="mt-2 text-sm text-slate-500">{emptyState.description}</p>
            )}
            {emptyState.actionLabel && emptyState.onAction && (
              <button
                type="button"
                onClick={emptyState.onAction}
                className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition-transform active:scale-[0.98]"
              >
                {emptyState.actionLabel}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={listClassName}>
          {cards.map((item) => {
            const styles = STATUS_STYLES[item.tone];
            const cardInteractive = Boolean(onCardClick);

            return (
              <div
                key={item.id}
                role={cardInteractive ? 'button' : undefined}
                tabIndex={cardInteractive ? 0 : undefined}
                onClick={() => onCardClick?.(item)}
                onKeyDown={
                  cardInteractive
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onCardClick?.(item);
                        }
                      }
                    : undefined
                }
                className={`relative ${cardClassName} flex-shrink-0 snap-center rounded-[2rem] border border-slate-100 bg-white p-6 text-left shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition-transform active:scale-[0.98]`}
              >
                {onHelpClick && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onHelpClick(item);
                    }}
                    className="absolute right-4 top-4 rounded-full bg-slate-50 p-1.5 text-slate-400 transition-colors hover:bg-sky-50 hover:text-sky-500"
                    aria-label={t('Open help for {{title}}', { title: item.title })}
                  >
                    <InfoIcon size={16} />
                  </button>
                )}

                <h4 className="max-w-[12rem] pr-6 text-[1.95rem] font-black leading-[1.02] tracking-tight text-slate-800">
                  {t(item.title)}
                </h4>

                <div className="mt-8 flex items-center gap-5">
                  <StatusIcon tone={item.tone} />

                  <div className="min-w-0 flex-1">
                    <span
                      className={`inline-flex rounded-full border px-4 py-2 text-sm font-black uppercase tracking-wide ${styles.pill}`}
                    >
                      {item.displayStatus}
                    </span>
                    <p className="mt-3 text-xs font-semibold leading-relaxed text-slate-500">
                      {item.detailText}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {item.metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2"
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                        {t(metric.label)}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-700">{metric.value}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  {item.lastUpdatedText}
                </p>

                {onAddDataClick && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onAddDataClick(item);
                    }}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-[1.45rem] bg-slate-100 py-4 text-sm font-black uppercase tracking-wide text-slate-600 transition-all hover:bg-slate-200 active:scale-[0.98]"
                  >
                    <PlusIcon className="h-4 w-4" />
                    {item.isRecorded ? t('Update Data') : t('Add Data')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default AnthropometricAssessmentSection;
