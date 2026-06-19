import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui';
import type { Gender } from '@/design-system/types';

export interface ChildBasicsData {
  name: string;
  gender: Gender;
  birthDate: string;
}

interface ChildBasicsFormProps {
  data: ChildBasicsData;
  onChange: (data: ChildBasicsData) => void;
}

const genderOptions: { value: Gender; label: string; emoji: string }[] = [
  { value: 'boy', label: 'Boy', emoji: '👦' },
  { value: 'girl', label: 'Girl', emoji: '👧' },
];

const getGenderStyles = (value: Gender, isSelected: boolean) => {
  if (!isSelected) return 'bg-white border-slate-200 text-slate-600 hover:border-slate-300';
  return value === 'boy'
    ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-200'
    : 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200';
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const YEAR_RANGE = 50;

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeDate = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const formatDateParts = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return {
    month,
    day,
    year: String(year),
  };
};

const getDaysInMonth = (month: number, year: number) => new Date(year, month, 0).getDate();

const parseDateValue = (value: string) => {
  if (!value) {
    return null;
  }

  const [yearRaw, monthRaw, dayRaw] = value.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!year || !month || !day) {
    return null;
  }

  const candidate = new Date(year, month - 1, day);
  const isRealDate =
    candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day;

  return isRealDate ? candidate : null;
};

const ChildBasicsForm: React.FC<ChildBasicsFormProps> = ({ data, onChange }) => {
  const { t } = useTranslation();
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const monthInputRef = useRef<HTMLInputElement | null>(null);
  const dayInputRef = useRef<HTMLInputElement | null>(null);
  const yearInputRef = useRef<HTMLInputElement | null>(null);
  const selectedDate = useMemo(() => parseDateValue(data.birthDate), [data.birthDate]);
  const today = useMemo(() => new Date(), []);
  const lastDate = useMemo(() => normalizeDate(today), [today]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [birthDateParts, setBirthDateParts] = useState(() =>
    data.birthDate && parseDateValue(data.birthDate)
      ? formatDateParts(parseDateValue(data.birthDate) as Date)
      : { month: '', day: '', year: '' }
  );
  const [birthDateError, setBirthDateError] = useState('');
  const [visibleMonth, setVisibleMonth] = useState(
    selectedDate ? selectedDate.getMonth() : today.getMonth()
  );
  const [visibleYear, setVisibleYear] = useState(
    selectedDate ? selectedDate.getFullYear() : today.getFullYear()
  );

  useEffect(() => {
    if (data.birthDate) {
      const parsed = parseDateValue(data.birthDate);
      if (parsed) {
        setBirthDateParts(formatDateParts(parsed));
        setBirthDateError('');
      }
      return;
    }

    setBirthDateParts({ month: '', day: '', year: '' });
  }, [data.birthDate, today]);

  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    setVisibleMonth(selectedDate.getMonth());
    setVisibleYear(selectedDate.getFullYear());
  }, [selectedDate]);

  useEffect(() => {
    if (!isCalendarOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isCalendarOpen]);

  const openBirthDatePicker = () => {
    setIsCalendarOpen(true);
  };

  const currentMonthDate = new Date(visibleYear, visibleMonth, 1);
  const daysInMonth = new Date(visibleYear, visibleMonth + 1, 0).getDate();
  const startDay = currentMonthDate.getDay();
  const leadingDays = Array.from({ length: startDay }, (_, index) => index);
  const dayNumbers = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const selectableYears = Array.from(
    { length: YEAR_RANGE + 1 },
    (_, index) => today.getFullYear() - index
  );

  const canMoveForward =
    visibleYear < today.getFullYear() ||
    (visibleYear === today.getFullYear() && visibleMonth < today.getMonth());

  const changeVisibleMonth = (offset: number) => {
    const nextDate = new Date(visibleYear, visibleMonth + offset, 1);

    if (nextDate > new Date(today.getFullYear(), today.getMonth(), 1)) {
      return;
    }

    setVisibleMonth(nextDate.getMonth());
    setVisibleYear(nextDate.getFullYear());
  };

  const selectDate = (day: number) => {
    const pickedDate = new Date(visibleYear, visibleMonth, day);
    if (pickedDate > lastDate) {
      return;
    }

    setBirthDateParts(formatDateParts(pickedDate));
    setBirthDateError('');
    onChange({ ...data, birthDate: formatDateValue(pickedDate) });
    setIsCalendarOpen(false);
  };

  const clearSavedBirthDateIfNeeded = (nextParts: typeof birthDateParts) => {
    const currentParts = selectedDate ? formatDateParts(selectedDate) : null;
    const hasChanged =
      !currentParts ||
      nextParts.month !== currentParts.month ||
      nextParts.day !== currentParts.day ||
      nextParts.year !== currentParts.year;

    if (data.birthDate && hasChanged) {
      onChange({ ...data, birthDate: '' });
    }
  };

  const validateAndCommitBirthDate = (parts: typeof birthDateParts) => {
    const { month, day, year } = parts;

    if (!month && !day && !year) {
      setBirthDateError(t('Date of birth is required'));
      onChange({ ...data, birthDate: '' });
      return;
    }

    if (month.length !== 2 || Number(month) < 1 || Number(month) > 12) {
      setBirthDateError(t('Enter a valid month between 01 and 12'));
      onChange({ ...data, birthDate: '' });
      return;
    }

    if (day.length !== 2) {
      setBirthDateError(t('Enter a valid day for the selected month'));
      onChange({ ...data, birthDate: '' });
      return;
    }

    if (year.length !== 4 || Number(year) < 1000) {
      setBirthDateError(t('Enter a valid 4-digit year'));
      onChange({ ...data, birthDate: '' });
      return;
    }

    const numericMonth = Number(month);
    const numericDay = Number(day);
    const numericYear = Number(year);

    if (numericYear > today.getFullYear()) {
      setBirthDateError(t('Enter a valid 4-digit year'));
      onChange({ ...data, birthDate: '' });
      return;
    }

    const maxDay = getDaysInMonth(numericMonth, numericYear);
    if (numericDay < 1 || numericDay > maxDay) {
      setBirthDateError(t('Enter a valid day for the selected month'));
      onChange({ ...data, birthDate: '' });
      return;
    }

    const parsed = new Date(numericYear, numericMonth - 1, numericDay);
    const normalizedParsed = normalizeDate(parsed);

    if (normalizedParsed > lastDate) {
      setBirthDateError(t('Date of birth cannot be in the future'));
      onChange({ ...data, birthDate: '' });
      return;
    }

    setBirthDateError('');
    setBirthDateParts(formatDateParts(normalizedParsed));
    setVisibleMonth(normalizedParsed.getMonth());
    setVisibleYear(normalizedParsed.getFullYear());
    onChange({ ...data, birthDate: formatDateValue(normalizedParsed) });
  };

  const handleDatePartChange = (
    part: keyof typeof birthDateParts,
    rawValue: string
  ) => {
    const maxLength = part === 'year' ? 4 : 2;
    const sanitized = rawValue.replace(/\D/g, '').slice(0, maxLength);
    const nextParts = { ...birthDateParts, [part]: sanitized };

    setBirthDateParts(nextParts);
    clearSavedBirthDateIfNeeded(nextParts);

    if (birthDateError) {
      setBirthDateError('');
    }

    if (part === 'month' && sanitized.length === 2) {
      if (Number(sanitized) < 1 || Number(sanitized) > 12) {
        setBirthDateError(t('Enter a valid month between 01 and 12'));
        return;
      }

      dayInputRef.current?.focus();
      return;
    }

    if (part === 'day' && sanitized.length === 2) {
      const numericDay = Number(sanitized);
      if (numericDay < 1 || numericDay > 31) {
        setBirthDateError(t('Enter a valid day for the selected month'));
        return;
      }

      if (nextParts.month.length === 2 && nextParts.year.length === 4) {
        const maxDay = getDaysInMonth(Number(nextParts.month), Number(nextParts.year));
        if (numericDay > maxDay) {
          setBirthDateError(t('Enter a valid day for the selected month'));
          return;
        }
      }

      yearInputRef.current?.focus();
      return;
    }

    if (part === 'year' && sanitized.length === 4) {
      validateAndCommitBirthDate(nextParts);
    }
  };

  const handleDatePartKeyDown = (
    part: keyof typeof birthDateParts,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key !== 'Backspace' || birthDateParts[part].length > 0) {
      return;
    }

    if (part === 'day') {
      monthInputRef.current?.focus();
    }

    if (part === 'year') {
      dayInputRef.current?.focus();
    }
  };

  const handleDateGroupBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (pickerRef.current?.contains(event.relatedTarget as Node)) {
      return;
    }

    validateAndCommitBirthDate(birthDateParts);
  };

  const handleVisibleMonthChange = (nextMonth: number) => {
    if (visibleYear === today.getFullYear() && nextMonth > today.getMonth()) {
      setVisibleMonth(today.getMonth());
      return;
    }

    setVisibleMonth(nextMonth);
  };

  const handleVisibleYearChange = (nextYear: number) => {
    setVisibleYear(nextYear);

    if (nextYear === today.getFullYear() && visibleMonth > today.getMonth()) {
      setVisibleMonth(today.getMonth());
    }
  };

  return (
    <div className="space-y-6">
      <Input
        label={t("Child's Name")}
        placeholder={t("e.g. Abenezer")}
        value={data.name}
        onChange={(e) => onChange({ ...data, name: e.target.value })}
      />

      <div>
        <label className="block text-sm font-bold text-slate-600 mb-3 ml-1">
          {t('Gender')}
        </label>
        <div className="grid grid-cols-2 gap-3">
          {genderOptions.map(({ value, label, emoji }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ ...data, gender: value })}
              className={`py-4 rounded-2xl border-2 text-sm font-bold transition-all active:scale-95 ${getGenderStyles(value, data.gender === value)}`}
            >
              <span className="text-xl block mb-1">{emoji}</span>
              {t(label)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-600 mb-3 ml-1">
          {t('Date of Birth')}
        </label>
        <div className="relative" ref={pickerRef}>
          <div
            className={`flex items-center gap-2 rounded-2xl border-2 bg-white px-4 py-3 pr-14 transition-all ${
              birthDateError ? 'border-rose-300' : 'border-slate-200'
            } focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100`}
            onBlur={handleDateGroupBlur}
          >
            <input
              ref={monthInputRef}
              type="text"
              inputMode="numeric"
              placeholder="MM"
              value={birthDateParts.month}
              onChange={(e) => handleDatePartChange('month', e.target.value)}
              onKeyDown={(e) => handleDatePartKeyDown('month', e)}
              className="min-w-0 flex-1 bg-transparent text-center text-base font-medium text-slate-800 outline-none"
            />
            <span className="text-slate-400">/</span>
            <input
              ref={dayInputRef}
              type="text"
              inputMode="numeric"
              placeholder="DD"
              value={birthDateParts.day}
              onChange={(e) => handleDatePartChange('day', e.target.value)}
              onKeyDown={(e) => handleDatePartKeyDown('day', e)}
              className="min-w-0 flex-1 bg-transparent text-center text-base font-medium text-slate-800 outline-none"
            />
            <span className="text-slate-400">/</span>
            <input
              ref={yearInputRef}
              type="text"
              inputMode="numeric"
              placeholder="YYYY"
              value={birthDateParts.year}
              onChange={(e) => handleDatePartChange('year', e.target.value)}
              onKeyDown={(e) => handleDatePartKeyDown('year', e)}
              className="min-w-0 basis-[42%] bg-transparent text-center text-base font-medium text-slate-800 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={openBirthDatePicker}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xl"
            aria-label={t('Open date picker')}
          >
            📅
          </button>
          {birthDateError && (
            <p className="mt-2 ml-1 text-sm text-rose-500">{birthDateError}</p>
          )}

          {isCalendarOpen && (
            <div className="absolute left-0 right-0 z-20 mt-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => changeVisibleMonth(-1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600"
                  aria-label={t('Previous month')}
                >
                  {"<"}
                </button>
                <div className="flex flex-1 items-center justify-center gap-2 px-2">
                  <select
                    value={visibleMonth}
                    onChange={(e) => handleVisibleMonthChange(Number(e.target.value))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-emerald-400"
                    aria-label={t('Select month')}
                  >
                    {MONTH_NAMES.map((monthName, index) => (
                      <option key={monthName} value={index}>
                        {monthName}
                      </option>
                    ))}
                  </select>
                  <select
                    value={visibleYear}
                    onChange={(e) => handleVisibleYearChange(Number(e.target.value))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-emerald-400"
                    aria-label={t('Select year')}
                  >
                    {selectableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => changeVisibleMonth(1)}
                  disabled={!canMoveForward}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 disabled:opacity-40"
                  aria-label={t('Next month')}
                >
                  {">"}
                </button>
              </div>

              <div className="mb-2 grid grid-cols-7 gap-1">
                {WEEKDAY_LABELS.map((label) => (
                  <div
                    key={label}
                    className="py-2 text-center text-[11px] font-black uppercase text-slate-400"
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {leadingDays.map((day) => (
                  <div key={`empty-${day}`} className="h-10" />
                ))}

                {dayNumbers.map((day) => {
                  const candidate = new Date(visibleYear, visibleMonth, day);
                  const isFuture = candidate > lastDate;
                  const isSelected =
                    selectedDate?.getFullYear() === visibleYear &&
                    selectedDate?.getMonth() === visibleMonth &&
                    selectedDate?.getDate() === day;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => selectDate(day)}
                      disabled={isFuture}
                      className={`h-10 rounded-xl text-sm font-bold transition-all ${
                        isSelected
                          ? 'bg-sky-500 text-white'
                          : isFuture
                          ? 'text-slate-300'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChildBasicsForm;
