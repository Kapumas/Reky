export function formatApartmentInput(nextValue: string, previousValue = ''): string {
  let value = nextValue.toUpperCase();

  value = value.replace(/[^A-Z0-9-]/g, '');

  if (value.length === 1 && /^\d$/.test(value) && value.length > previousValue.length) {
    value = `${value}-`;
  }

  const hyphenCount = (value.match(/-/g) || []).length;
  if (hyphenCount > 1) {
    const firstHyphenIndex = value.indexOf('-');
    value = value
      .split('')
      .filter((char, index) => char !== '-' || index === firstHyphenIndex)
      .join('');
  }

  const [towerRaw, apartmentRaw = ''] = value.split('-');
  const tower = towerRaw.replace(/[^0-9]/g, '');
  const apartment = apartmentRaw.replace(/[^A-Z0-9]/g, '');

  const formattedValue = value.includes('-') ? `${tower}-${apartment}` : tower;

  return formattedValue.slice(0, 10);
}
