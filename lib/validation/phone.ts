/**
 * Mobile phone validation, ported from the legacy `src/utils/validator` tree.
 *
 * @see https://github.com/validatorjs/validator.js
 */

export const patterns: Record<string, RegExp> = {
  86: /^((\+|00)86)?(1[3-9]|9[28])\d{9}$/,
  65: /^(\+65)?[3689]\d{7}$/,
  852: /^(\+?852[-\s]?)?[456789]\d{3}[-\s]?\d{4}$/,
  853: /^(\+?853[-\s]?)?[6]\d{3}[-\s]?\d{4}$/,
  886: /^(\+?886-?|0)?9\d{8}$/,
};

export function isMobilePhone(value: string, interCode: string): boolean {
  const pattern = patterns[interCode];

  return pattern ? pattern.test(value) : false;
}
