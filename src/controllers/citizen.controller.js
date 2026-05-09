const citizenService = require('../services/citizen.service');

exports.getMyChildrenBirths = async (req, res, next) => {
  try {
    const citizenId = req.user.id;
    const births = await citizenService.getMyChildrenBirths(citizenId);
    
    res.status(200).json({
      status: 'success',
      data: births
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Récupère un acte par nationalId (format GN-AAAA-PREF-XXX)
exports.getBirthByNationalId = async (req, res, next) => {
  try {
    const citizenId = req.user.id;
    const { nationalId } = req.params;
    const birth = await citizenService.getBirthByNationalId(citizenId, nationalId);
    res.status(200).json({ status: 'success', data: birth });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Télécharge le PDF — accepte un birthId (UUID) ou un nationalId (GN-...)
exports.downloadCertificate = async (req, res, next) => {
  try {
    const citizenId = req.user.id;
    const { birthId } = req.params;
    
    const pdfBuffer = await citizenService.getBirthCertificatePDF(citizenId, birthId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=acte_naissance_${birthId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};
