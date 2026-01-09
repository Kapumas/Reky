/**
 * Generate a unique 8-character confirmation code
 * Excludes similar-looking characters (I/1, O/0) for better readability
 */
export function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
}

/**
 * Format confirmation code for display with spacing
 * Example: "ABCD1234" -> "ABCD-1234"
 */
export function formatConfirmationCode(code: string): string {
  if (code.length !== 8) return code;
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/**
 * Validate confirmation code format
 */
export function isValidConfirmationCode(code: string): boolean {
  const cleanCode = code.replace('-', '');
  return /^[A-Z0-9]{8}$/.test(cleanCode);
}
