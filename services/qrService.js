const QRCode = require("qrcode");

class QRService {
  async generateShopQR(shopId) {
    const url = `${process.env.APP_URL}/shop.html?shop=${shopId}`;

    const qrImage = await QRCode.toDataURL(url, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 400
    });

    return {
      url,
      qrImage
    };
  }

  async generatePrintableQR(shopId) {
    const url = `${process.env.APP_URL}/shop.html?shop=${shopId}`;

    return QRCode.toString(url, {
      type: "svg",
      width: 400
    });
  }
}

module.exports = new QRService();