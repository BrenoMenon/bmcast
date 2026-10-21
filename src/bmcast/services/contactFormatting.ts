export function formatWhatsApp(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  const number = digits.slice(2);
  const split = number.length > 8 ? 5 : 4;
  return `(${digits.slice(0, 2)}) ${number.slice(0, split)}${number.length > split ? `-${number.slice(split)}` : ''}`;
}

export function normalizeInstagram(value: string): string {
  return value.replace(/@/g, '').replace(/[^a-zA-Z0-9._]/g, '').slice(0, 30);
}

export function editableCompanyName(value: string): string {
  return value.trim() === 'Minha Empresa' ? '' : value;
}