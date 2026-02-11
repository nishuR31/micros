import jwt from 'jsonwebtoken';

let accessKey = process.env.ACCESS_KEY;
let refreshKey = process.env.REFRESH_KEY;

if (!accessKey || !refreshKey) {
  throw new Error('JWT secrets are missing from environment variables.');
}

export function accessToken(payload) {
  return jwt.sign(payload, accessKey, { expiresIn: '7d' });
}
export function refreshToken(payload) {
  return jwt.sign(payload, refreshKey, { expiresIn: '15d' });
}

export function tokens(payload) {
  return {
    accessToken: accessToken(payload),
    refreshToken: refreshToken(payload),
  };
}

export function verifyAccess(token) {
  return jwt.verify(token, accessKey);
}
export function verifyRefresh(token) {
  return jwt.verify(token, refreshKey);
}
