import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (value: string) => {
  if (!value) {
    return 'mm / dd / yyyy';
  }

  const [year, month, day] = value.split('-');
  if (!year || !month || !day) {
    return 'mm / dd / yyyy';
  }

  return `${month} / ${day} / ${year}`;
};

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

  return new Date(year, month - 1, day);
};

const ChildBasicsForm: React.FC<ChildBasicsFormProps> = ({ data, onChange }) => {
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const selectedDate = useMemo(() => parseDateValue(data.birthDate), [data.birthDate]);
  const today = useMemo(() => new Date(), []);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    selectedDate ? selectedDate.getMonth() : today.getMonth()
  );
  const [visibleYear, setVisibleYear] = useState(
    selectedDate ? selectedDate.getFullYear() : today.getFullYear()
  );

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
  const lastDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const leadingDays = Array.from({ length: startDay }, (_, index) => index);
  const dayNumbers = Array.from({ length: daysInMonth }, (_, index) => index + 1);

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

    onChange({ ...data, birthDate: formatDateValue(pickedDate) });
    setIsCalendarOpen(false);
  };

  return (
    <div className="space-y-6">
      <Input
        label="Child's Name"
        placeholder="e.g. Abenezer"
        value={data.name}
        onChange={(e) => onChange({ ...data, name: e.target.value })}
      />

      <div>
        <label className="block text-sm font-bold text-slate-600 mb-3 ml-1">
          Gender
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
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-600 mb-3 ml-1">
          Date of Birth
        </label>
        <div className="relative" ref={pickerRef}>
          <button
            type="button"
            onClick={openBirthDatePicker}
            className="w-full px-5 py-4 pr-14 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 text-left text-slate-800 font-medium transition-all"
          >
            {formatDisplayDate(data.birthDate)}
          </button>
          <button
            type="button"
            onClick={openBirthDatePicker}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xl"
            aria-label="Open date picker"
          >
            📅
          </button>

          {isCalendarOpen && (
            <div className="absolute left-0 right-0 z-20 mt-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => changeVisibleMonth(-1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600"
                  aria-label="Previous month"
                >
                  {"<"}
                </button>
                <div className="text-center">
                  <div className="text-sm font-black text-slate-800">
                    {MONTH_NAMES[visibleMonth]}
                  </div>
                  <div className="text-xs font-bold text-slate-400">{visibleYear}</div>
                </div>
                <button
                  type="button"
                  onClick={() => changeVisibleMonth(1)}
                  disabled={!canMoveForward}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 disabled:opacity-40"
                  aria-label="Next month"
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
