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
