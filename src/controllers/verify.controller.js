const verifyService = require('../services/verify.service');

exports.verifyQR = async (req, res) => {
  try {
    const { qrPayload, verifierType } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const origin = `${req.protocol}://${req.get('host')}`;

    if (!qrPayload) {
      return res.status(400).json({ status: 'error', message: 'Le payload du QR Code est requis' });
    }

    const verificationResult = await verifyService.verifyFromQRCode(qrPayload, ipAddress, verifierType);

    if (verificationResult.isValid) {
      const documentUrl = `${origin}/api/verify/document/${verificationResult.data.nationalId}`;
      return res.status(200).json({
        status: 'success',
        message: 'Acte authentique et vérifié',
        data: {
          ...verificationResult.data,
          documentUrl
        }
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

exports.verifyId = async (req, res) => {
  try {
    const { nationalId, verifierType } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const origin = `${req.protocol}://${req.get('host')}`;

    if (!nationalId) {
      return res.status(400).json({ status: 'error', message: 'L\'identifiant national est requis' });
    }

    const verificationResult = await verifyService.verifyFromNationalId(nationalId, ipAddress, verifierType);

    if (verificationResult.isValid) {
      const documentUrl = `${origin}/api/verify/document/${verificationResult.data.nationalId}`;
      return res.status(200).json({
        status: 'success',
        message: 'Acte authentique et certifié',
        data: {
          ...verificationResult.data,
          documentUrl
        }
      });
    } else {
      return res.status(404).json({
        status: 'error',
        message: verificationResult.reason
      });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getDocument = async (req, res) => {
  try {
    const { nationalId } = req.params;
    const pdfBuffer = await verifyService.generatePublicBirthCertificatePDF(nationalId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=acte_naissance_${nationalId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};
