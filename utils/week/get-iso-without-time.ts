export function getIsoWithoutTime(date: number | string | Date) {
  const d = new Date(date);
  const data = {
    year: d.getFullYear(),
    month:
      d.getMonth().toString().length === 1
        ? `0${d.getMonth() + 1}`
        : d.getMonth() + 1,
    day: d.getDate().toString().length === 1 ? `0${d.getDate()}` : d.getDate(),
  };

  const diff = `${data.year}-${data.month}-${data.day}`;

  return diff;
}
