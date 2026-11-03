/**
 * 18-digit mainland China identity card validation.
 *
 * Ported from the legacy `src/utils/validator/isIdentityCard.ts`:
 * six-digit address code + eight-digit birth date + three-digit sequence
 * + one check digit.
 */

const PATTERN =
  /^(([1][1-5])|([2][1-3])|([3][1-7])|([4][1-6])|([5][0-4])|([6][1-5])|([7][1])|([8][1-2]))\d{4}(([1][9]\d{2})|([2]\d{3}))(([0][1-9])|([1][0-2]))(([0][1-9])|([1-2][0-9])|([3][0-1]))\d{3}[0-9xX]$/i;

const PROVINCE_CODES = new Set([
  '11',
  '12',
  '13',
  '14',
  '15',
  '21',
  '22',
  '23',
  '31',
  '32',
  '33',
  '34',
  '35',
  '36',
  '37',
  '41',
  '42',
  '43',
  '44',
  '45',
  '46',
  '50',
  '51',
  '52',
  '53',
  '54',
  '61',
  '62',
  '63',
  '64',
  '65',
  '71',
  '81',
  '82',
  '91',
]);

const FACTORS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const PARITY = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

export function isIdentityCard(value: unknown): boolean {
  const code = typeof value === 'string' ? value : String(value ?? '');

  if (code.length !== 18 || !PATTERN.test(code)) {
    return false;
  }

  if (!PROVINCE_CODES.has(code.slice(0, 2))) {
    return false;
  }

  const sum = FACTORS.reduce((total, factor, index) => total + Number(code[index]) * factor, 0);

  return PARITY[sum % 11] === code[17].toUpperCase();
}
