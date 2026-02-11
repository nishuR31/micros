import QRCode from 'qrcode';

export const generate = async (text) => {
  try {
    const qrImage = await QRCode.toDataURL(text);
    return qrImage;
  } catch (err) {
    throw new Error('Failed to generate QR code: ' + err.message);
  }
};

export const render = function(qrDataUrl, size = 300) {
  return '<img src="' + qrDataUrl + '" alt="QR Code" style="width: ' + size + 'px; height: ' + size + 'px;" />';
};

export default { generate, render };
