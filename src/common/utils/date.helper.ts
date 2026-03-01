import {
  addDays as dateFnsAddDays,
  isWeekend as dateFnsIsWeekend,
} from 'date-fns';

export function isWeekend(date: Date): boolean {
  return dateFnsIsWeekend(date);
}

export function isWeekday(date: Date): boolean {
  return !dateFnsIsWeekend(date);
}

export function addDays(date: Date, days: number): Date {
  return dateFnsAddDays(date, days);
}

export function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function isPast(date: Date): boolean {
  const today = getToday();
  return date < today;
}

export function isToday(date: Date): boolean {
  const today = getToday();
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate.getTime() === today.getTime();
}

export function parseDateString(dateString: string): Date | null {
  // Validate format first
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  const parts = dateString.split('-');
  if (parts.length !== 3) {
    return null;
  }

  const [year, month, day] = parts.map(Number);

  // check if all parts are valid numbers
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return null;
  }

  // create date and validate it
  const date = new Date(year, month - 1, day);

  // check if date is valid (JavaScript Date can create invalid dates)
  if (isNaN(date.getTime())) {
    return null;
  }

  // verify the date components match (handles cases like Feb 31)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
