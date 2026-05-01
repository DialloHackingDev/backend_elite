const prisma = require('../config/database');
const { generateNationalId, generatePayloadHash } = require('../utils/hash.util');
const { generateBirthCertificatePDF } = require('../utils/pdf.util');
const { uploadToIPFS } = require('../utils/ipfs.util');
const { registerBirthOnChain } = require('../blockchain/birthRegistry');

class BirthService {
  /**
   * Enregistre une nouvelle naissance (Flux complet)
   */
  async registerBirth(payload, agentId) {
    // 1. Vérification de l'établissement
    const establishment = await prisma.establishment.findUnique({
      where: { code: payload.establishmentCode }
    });

    if (!establishment) {
      throw new Error(`Établissement inconnu avec le code: ${payload.establishmentCode}`);
    }

    // 2. Génération ID National (GN-AAAA-PREF-XXXX)
    const nationalId = generateNationalId(establishment.prefecture);

    // 3. Normalisation & Hachage
    // Le payload pour le hash inclut l'ID et exclut les champs sensibles chiffrés si nécessaire
    const payloadToHash = {
      nationalId,
      childFirstName: payload.childFirstName,
      childLastName: payload.childLastName,
      childGender: payload.childGender,
      dateOfBirth: payload.dateOfBirth,
      placeOfBirth: payload.placeOfBirth,
      motherFullName: payload.motherFullName,
      fatherFullName: payload.fatherFullName || '',
      establishmentCode: payload.establishmentCode
    };

    const hash = generatePayloadHash(payloadToHash);

    // 4. Génération du QR Code anti-falsification (HMAC)
    const { generateQRCodeDataURL } = require('../utils/qr.util');
    const qrCodeDataURL = await generateQRCodeDataURL(nationalId, hash);

    // 5. Génération du PDF
    // On ajoute l'ID, le hash et le QRCode au payload pour le rendu PDF
    const pdfBuffer = await generateBirthCertificatePDF({
      ...payload,
      nationalId,
      blockchainHash: hash,
      qrCodeDataURL
    });

    // 5. Upload sur IPFS
    const ipfsCid = await uploadToIPFS(pdfBuffer, `${nationalId}.pdf`);

    // 6. Inscription sur la Blockchain
    const txHash = await registerBirthOnChain(nationalId, hash);

    // 7. Sauvegarde finale en BDD
    // Note : motherCni et fatherCni devraient être chiffrés avec crypto.util en production
    const newBirth = await prisma.birth.create({
      data: {
        nationalId,
        blockchainHash: txHash, // On stocke la transaction
        ipfsCid,
        status: 'REGISTERED',
        childFirstName: payload.childFirstName,
        childLastName: payload.childLastName,
        childGender: payload.childGender,
        dateOfBirth: new Date(payload.dateOfBirth),
        timeOfBirth: payload.timeOfBirth,
        placeOfBirth: payload.placeOfBirth,
        motherFullName: payload.motherFullName,
        motherDob: new Date(payload.motherDob),
        motherCni: payload.motherCni,
        motherPrefecture: payload.motherPrefecture,
        fatherFullName: payload.fatherFullName,
        fatherDob: payload.fatherDob ? new Date(payload.fatherDob) : null,
        fatherCni: payload.fatherCni,
        gpsCoordinates: payload.gpsCoordinates,
        agentId: agentId,
        establishmentId: establishment.id
      }
    });

    // 8. Notification Asynchrone (Twilio WhatsApp/SMS)
    if (payload.parentPhoneNumber) {
      const { enqueueNotificationJob } = require('../jobs/sms.queue');
      // On envoie le job dans Redis sans bloquer la réponse de l'API
      await enqueueNotificationJob(
        payload.parentPhoneNumber,
        payload.childFirstName,
        nationalId,
        ipfsCid,
        true // true = préférer WhatsApp
      );
    }

    return newBirth;
  }

  async getBirthByNationalId(nationalId) {
    const birth = await prisma.birth.findUnique({
      where: { nationalId },
      include: {
        establishment: true,
        agent: { select: { firstName: true, lastName: true, nationalAgentId: true } }
      }
    });

    if (!birth) throw new Error('Acte introuvable');
    return birth;
  }
}

module.exports = new BirthService();
