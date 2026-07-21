/**
 * Máscara para CPF: 000.000.000-00
 */
export const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '') // Remove tudo o que não é dígito
    .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto entre o terceiro e o quarto dígitos
    .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto entre o sexto e o sétimo dígitos
    .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Coloca hífen entre o nono e o décimo dígitos
    .replace(/(-\d{2})\d+?$/, '$1'); // Limita a 11 dígitos
};

/**
 * Máscara para Telefone: (00) 00000-0000
 */
export const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

/**
 * Máscara para CEP: 00000-000
 */
export const maskCEP = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
};

/**
 * Aceita valores em formato brasileiro ("2.500,00", "2500,50") ou
 * americano ("2500.50") e retorna o número correspondente.
 * "2.500" (sem vírgula) é tratado como separador de milhar → 2500.
 */
export const parseMoney = (value: string): number | null => {
  if (!value) return null;
  let s = value.replace(/[R$\s]/g, '');
  if (!s) return null;
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

/** Formata número para exibição em campo de valor: 2500.5 → "2.500,50" */
export const formatMoney = (value: number | null | undefined): string => {
  if (value == null) return '';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
