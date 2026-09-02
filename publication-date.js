function formatPublicationDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear() % 100).padStart(2, '0')}`;
}

function parsePublicationDate(value, referenceDate) {
  const match = /^(\d{2})\/(\d{2})\/(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, day, month, shortYear] = match.map(Number);
  // Preserve the century of an existing or calendar-selected date.
  const year = referenceDate && referenceDate.getFullYear() % 100 === shortYear
    ? referenceDate.getFullYear() : 2000 + shortYear;
  const date = new Date(year, month - 1, day, 12);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}
