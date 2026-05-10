const prisma = require('../config/database');
const { generateBirthCertificatePDF } = require('../utils/pdf.util');
const { generateQRCodeDataURL } = require('../utils/qr.util');

class CitizenService {
  /**
   * Récupère tous les actes de naissance liés au citoyen :
   * 1. Via le CNI du parent (enregistrements directs)
   * 2. Via les demandes validées du citoyen (workflow famille)
   */
  async getMyChildrenBirths(citizenId) {
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId }
    });

    if (!citizen) {
      throw new Error('Accès non autorisé');
    }

    // Méthode 1 : Births liés aux demandes validées du citoyen
    const requestBirths = await prisma.birth.findMany({
      where: {
        request: {
          citizenId: citizenId,
          status: 'COMPLETED'
        }
      },
      include: { establishment: true },
      orderBy: { dateOfBirth: 'desc' }
    });

    // Méthode 2 : Births directs par CNI (enregistrements sans demande)
    const cniIds = requestBirths.map(b => b.id);
    const cniBirths = await prisma.birth.findMany({
      where: {
        AND: [
          {
            OR: [
              { motherCni: citizen.cniNumber },
              { fatherCni: citizen.cniNumber }
            ]
          },
          { id: { notIn: cniIds } } // Éviter les doublons
        ]
      },
      include: { establishment: true },
      orderBy: { dateOfBirth: 'desc' }
    });

    // Fusionner sans duplication
    return [...requestBirths, ...cniBirths];
  }

  /**
   * Récupère un acte de naissance par son nationalId (format GN-AAAA-PREF-XXX)
   * Pour que la famille puisse accéder à son acte avec l'ID reçu de l'agent
   */
  async getBirthByNationalId(citizenId, nationalId) {
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId }
    });

    const birth = await prisma.birth.findUnique({
      where: { nationalId },
      include: { establishment: true, request: true }
    });

    if (!birth) throw new Error('Aucun acte trouvé avec cet identifiant');

    // Vérifier que la famille est autorisée (via sa demande ou son CNI)
    const isOwner =
      birth.motherCni === citizen.cniNumber ||
      birth.fatherCni === citizen.cniNumber ||
      birth.request?.citizenId === citizenId;

    if (!isOwner) throw new Error('Vous n\'êtes pas autorisé à accéder à cet acte');

    return birth;
  }

  /**
   * Génère le PDF pour un acte spécifique appartenant au citoyen
   * Accepte un birthId (UUID) ou un nationalId (GN-AAAA-PREF-XXX)
   */
  async getBirthCertificatePDF(citizenId, birthId) {
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId }
    });

    // Chercher par UUID ou par nationalId
    const birth = await prisma.birth.findFirst({
      where: {
        OR: [
          { id: birthId },
          { nationalId: birthId }
        ]
      },
      include: { establishment: true, request: true }
    });

    if (!birth) throw new Error('Acte introuvable');

    // Vérification de parenté (par CNI ou via demande)
    const isOwner =
      birth.motherCni === citizen.cniNumber ||
      birth.fatherCni === citizen.cniNumber ||
      birth.request?.citizenId === citizenId;

    if (!isOwner) throw new Error('Vous n\'êtes pas autorisé à accéder à cet acte');

    // Préparer les données du QR Code (signature HMAC et URL) — passer les paramètres requis
    const qrCodeDataURL = await generateQRCodeDataURL(birth.nationalId, birth.blockchainHash);

    const pdfBuffer = await generateBirthCertificatePDF({
      ...birth,
      qrCodeDataURL
    });

    return pdfBuffer;
  }
}

module.exports = new CitizenService();
