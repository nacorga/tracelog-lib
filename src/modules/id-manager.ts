export const IdManager = {
  create(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const buffer = new Uint8Array(16);

      crypto.getRandomValues(buffer);

      buffer[6] = (buffer[6] & 0x0f) | 0x40;
      buffer[8] = (buffer[8] & 0x3f) | 0x80;

      const hex = Array.from(buffer, (b) => b.toString(16).padStart(2, '0'));

      return [
        hex.slice(0, 4).join(''),
        hex.slice(4, 6).join(''),
        hex.slice(6, 8).join(''),
        hex.slice(8, 10).join(''),
        hex.slice(10, 16).join(''),
      ].join('-');
    }

    let uuid = '';
    let index = 0;

    while (index < 36) {
      switch (index) {
        case 8:
        case 13:
        case 18:
        case 23: {
          uuid += '-';

          break;
        }
        case 14: {
          uuid += '4';

          break;
        }
        case 19: {
          uuid += Math.trunc((Math.random() * 4) | 8).toString(16);

          break;
        }
        default: {
          uuid += Math.trunc(Math.random() * 16).toString(16);
        }
      }
      index++;
    }

    return uuid;
  },
};
