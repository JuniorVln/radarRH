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
