const prisma = require('../config/database');
const { verifyHMACSignature } = require('../utils/qr.util');

class VerifyService {
  /**
   * Vérifie un acte via le contenu complet de son QR Code
   */
  async verifyFromQRCode(qrPayload, ipAddress, verifierType) {
    try {
      const data = JSON.parse(qrPayload);
      const { id, hash, sig } = data;

      // 1. Vérification cryptographique anti-falsification (HMAC)
      const isValidSignature = verifyHMACSignature(id, hash, sig);
      if (!isValidSignature) {
        await this.logVerification(id, ipAddress, verifierType, 'INVALID_SIGNATURE');
        return { isValid: false, reason: 'Signature QR Code invalide ou falsifiée' };
      }

      // 2. Vérification en base de données
      const birth = await prisma.birth.findUnique({
        where: { nationalId: id },
        include: { establishment: true }
      });

      if (!birth) {
        await this.logVerification(id, ipAddress, verifierType, 'NOT_FOUND');
        return { isValid: false, reason: 'Acte introuvable dans le registre national' };
      }

      // 3. Vérification de l'intégrité (Hash)
      if (birth.blockchainHash !== hash) {
        await this.logVerification(birth.id, ipAddress, verifierType, 'HASH_MISMATCH');
        return { isValid: false, reason: 'Les données de l\'acte ont été altérées' };
      }

      // Tout est bon, on log le succès
      await this.logVerification(birth.id, ipAddress, verifierType, 'VALID');

      return {
        isValid: true,
        data: {
          nationalId: birth.nationalId,
          childFirstName: birth.childFirstName,
          childLastName: birth.childLastName,
          dateOfBirth: birth.dateOfBirth,
          placeOfBirth: birth.placeOfBirth,
          establishment: birth.establishment.name,
          ipfsUrl: `https://gateway.pinata.cloud/ipfs/${birth.ipfsCid}`
        }
      };

    } catch (error) {
      return { isValid: false, reason: 'Format du QR Code invalide' };
    }
  }

  /**
   * Vérifie un acte via son Identifiant National unique (Saisie manuelle)
   */
  async verifyFromNationalId(nationalId, ipAddress, verifierType) {
    const birth = await prisma.birth.findUnique({
      where: { nationalId },
      include: { establishment: true }
    });

    if (!birth) {
      return { isValid: false, reason: 'Aucun acte trouvé avec cet identifiant national' };
    }

    // Un acte est considéré "Authentique" s'il a un hash blockchain valide
    if (!birth.blockchainHash) {
      await this.logVerification(birth.id, ipAddress, verifierType, 'NOT_SYNCED');
      return { isValid: false, reason: 'Cet acte n\'est pas encore certifié sur la blockchain' };
    }

    await this.logVerification(birth.id, ipAddress, verifierType, 'VALID');

    return {
      isValid: true,
      data: {
        nationalId: birth.nationalId,
        childFirstName: birth.childFirstName,
        childLastName: birth.childLastName,
        dateOfBirth: birth.dateOfBirth,
        placeOfBirth: birth.placeOfBirth,
        establishment: birth.establishment.name,
        blockchainHash: birth.blockchainHash,
        ipfsUrl: birth.ipfsCid ? `https://gateway.pinata.cloud/ipfs/${birth.ipfsCid}` : null
      }
    };
  }

  /**
   * Audit: Log la tentative de vérification
   */
  async logVerification(birthIdentifier, ipAddress, verifierType, result) {
    try {
      // Si l'ID passé est un nationalId (en cas d'échec de la DB), on essaie de trouver le vrai ID
      let birthId = birthIdentifier;
      if (birthIdentifier.startsWith('GN-')) {
        const b = await prisma.birth.findUnique({ where: { nationalId: birthIdentifier } });
        if (b) birthId = b.id;
        else return; // Impossible de logger si l'acte n'existe vraiment pas dans notre DB
      }

      await prisma.verification.create({
        data: {
          birthId,
          ipAddress,
          verifierType: verifierType || 'PUBLIC',
          result
        }
      });
    } catch (e) {
      console.error('Erreur lors du log de vérification:', e.message);
    }
  }
}

module.exports = new VerifyService();
