const FALLBACK = 'â€”';

export const toDate = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      return toDate(value.toDate());
    }
    const { seconds, nanoseconds } = value;
    if (typeof seconds === 'number') {
      const millis = seconds * 1000 + (nanoseconds || 0) / 1_000_000;
      return toDate(new Date(millis));
    }
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
};

const formatDateParts = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return {
    day,
    month,
    year,
    hours,
    minutes,
  };
};

export const formatDate = (value, { withTime = false } = {}) => {






