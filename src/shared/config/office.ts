/**
 * The meeting room is a physical place, so «today» and «now» are the office's — not the
 * browser's and not the server's (Vercel runs in UTC). Both sides read this one value.
 */
export const OFFICE_TIME_ZONE = process.env.NEXT_PUBLIC_OFFICE_TIME_ZONE || 'Asia/Almaty';
