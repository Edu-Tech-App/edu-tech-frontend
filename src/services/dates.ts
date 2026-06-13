export const parseLocalDate = (value: string | Date) => {
  if (value instanceof Date) return new Date(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
};

export const formatDateEs = (
  value?: string | Date | null,
  options?: Intl.DateTimeFormatOptions,
) => {
  if (!value) return "Sin fecha";
  return parseLocalDate(value).toLocaleDateString("es-ES", options);
};

export const formatDateTimeEs = (
  value?: string | Date | null,
  options?: Intl.DateTimeFormatOptions,
) => {
  if (!value) return "Sin fecha";
  return parseLocalDate(value).toLocaleString("es-ES", options);
};

export const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};
