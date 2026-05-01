const verifyService = require('../services/verify.service');

exports.verifyQR = async (req, res) => {
  try {
    const { qrPayload, verifierType } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (!qrPayload) {
      return res.status(400).json({ status: 'error', message: 'Le payload du QR Code est requis' });
    }

    const verificationResult = await verifyService.verifyFromQRCode(qrPayload, ipAddress, verifierType);

    if (verificationResult.isValid) {
      return res.status(200).json({
        status: 'success',
        message: 'Acte authentique et vérifié',
        data: verificationResult.data
      });
    } else {
      return res.status(403).json({
        status: 'error',
        message: verificationResult.reason
      });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
