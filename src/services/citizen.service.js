const prisma = require('../config/database');
const { generateBirthCertificatePDF } = require('../utils/pdf.util');
const { generateQRCodeDataURL } = require('../utils/qr.util');

class CitizenService {
  /**
   * Récupère tous les actes de naissance liés au citoyen (en tant que mère ou père)
   */
  async getMyChildrenBirths(citizenId) {
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId }
    });

    if (!citizen) {
      throw new Error('Accès non autorisé');
    }

    // On cherche les naissances où le CNI du parent correspond au nationalAgentId du citoyen
    // Note: Dans une version plus avancée, on gérerait le chiffrement ici
    const births = await prisma.birth.findMany({
      where: {
        OR: [
          { motherCni: citizen.cniNumber },
          { fatherCni: citizen.cniNumber }
        ]
      },
      include: {
        establishment: true
      },
      orderBy: { dateOfBirth: 'desc' }
    });

    return births;
  }

  /**
   * Génère le PDF pour un acte spécifique appartenant au citoyen
   */
  async getBirthCertificatePDF(citizenId, birthId) {
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId }
    });

    const birth = await prisma.birth.findUnique({
      where: { id: birthId },
      include: { establishment: true }
    });

    if (!birth) throw new Error('Acte introuvable');

    // Vérification de parenté
    if (birth.motherCni !== citizen.cniNumber && birth.fatherCni !== citizen.cniNumber) {
      throw new Error('Vous n\'êtes pas autorisé à accéder à cet acte');
    }

    // Générer les données pour le PDF (incluant le QR Code)
    const qrData = JSON.stringify({
      id: birth.nationalId,
      hash: birth.blockchainHash
    });
    
    const qrCodeDataURL = await generateQRCodeDataURL(qrData);
    
    const pdfBuffer = await generateBirthCertificatePDF({
      ...birth,
      qrCodeDataURL
    });

    return pdfBuffer;
  }
}

module.exports = new CitizenService();
