(function (root) {
  'use strict';

  const IPV4 = (root.EGE_CONTENT || (typeof require !== 'undefined' ? require('./content.js') : null)).IPV4;

  function validIp(ip) {
    const parts = String(ip).trim().split('.');
    return parts.length === 4 && parts.every(part => /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255);
  }

  function classfulPrefix(firstOctet) {
    if (firstOctet < 128) return 8;
    if (firstOctet < 192) return 16;
    if (firstOctet < 224) return 24;
    return null;
  }

  function calculate(ip, prefixValue) {
    const prefix = Number(prefixValue);
    if (!validIp(ip)) return { error: 'Escribe una IPv4 válida con cuatro octetos entre 0 y 255.' };
    if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return { error: 'El prefijo debe ser un entero entre 0 y 32.' };

    const ipInt = IPV4.toInt(ip.trim());
    const maskInt = IPV4.mask(prefix);
    const networkInt = (ipInt & maskInt) >>> 0;
    const size = 2 ** (32 - prefix);
    const broadcastInt = networkInt + size - 1;
    const hostBits = 32 - prefix;
    const hosts = Math.max(0, size - 2);
    const classPrefix = classfulPrefix(Number(ip.trim().split('.')[0]));
    const borrowed = classPrefix === null ? null : prefix - classPrefix;
    const maskBinary = [24, 16, 8, 0].map(shift => ((maskInt >>> shift) & 255).toString(2).padStart(8, '0')).join('.');

    return {
      ip: ip.trim(), prefix,
      cidr: `${ip.trim()}/${prefix}`,
      mask: IPV4.toIp(maskInt),
      wildcard: IPV4.toIp((~maskInt) >>> 0),
      network: IPV4.toIp(networkInt),
      broadcast: IPV4.toIp(broadcastInt),
      firstHost: hosts > 0 ? IPV4.toIp(networkInt + 1) : 'No aplica',
      lastHost: hosts > 0 ? IPV4.toIp(broadcastInt - 1) : 'No aplica',
      hosts, total: size, hostBits, maskBinary,
      classPrefix,
      borrowed,
      borrowedLabel: borrowed === null ? 'Sin clase con clase' : borrowed >= 0 ? String(borrowed) : 'No aplica (superred)',
      blockSize: size >= 256 ? `${size} direcciones totales` : String(size),
      note: prefix >= 31 ? 'Cálculo convencional de subred: se reservan direcciones de red y broadcast; no quedan hosts utilizables bajo esa regla.' : ''
    };
  }

  const api = { validIp, classfulPrefix, calculate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.EGE_CALCULATOR = api;
})(typeof window !== 'undefined' ? window : globalThis);
