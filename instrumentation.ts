// This file runs before Next.js starts
// Set timezone for the entire Node.js process
export function register() {
  process.env.TZ = 'America/Bogota';
}
