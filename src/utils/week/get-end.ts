export function getLastDayInWeek(date: number | string | Date) {
  const d = new Date(date);
  const diff = d.getDate() - (d.getDay() - 1) + (d.getDay() === 0 ? -1 : 6);
  
  return new Date(d.setDate(diff));
}
