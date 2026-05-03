const prisma = require('../config/database');
const { verifyHMACSignature } = require('../utils/qr.util');

class VerifyService {
  /**
   * Vérifie un acte via le contenu complet de son QR Code
   * VERSION HACKATHON: Vérifie uniquement l'ID national pour faciliter la démo
   */
  async verifyFromQRCode(qrPayload, ipAddress, verifierType) {
    try {
      const data = JSON.parse(qrPayload);
      const { id, hash, sig } = data;

      // Vérification que l'ID est présent
      if (!id) {
        return { isValid: false, reason: 'ID national manquant dans le QR Code' };
      }

      // Vérification en base de données
      const birth = await prisma.birth.findUnique({
        where: { nationalId: id },
        include: { establishment: true }
      });

      if (!birth) {
        await this.logVerification(id, ipAddress, verifierType, 'NOT_FOUND');
        return { isValid: false, reason: 'Acte introuvable dans le registre national' };
      }

      // Vérification optionnelle du hash (si fourni et valide)
      const hashValid = !hash || birth.blockchainHash === hash;
      
      // Vérification optionnelle de la signature (si fournie)
      let sigValid = true;
      if (sig && hash) {
        sigValid = verifyHMACSignature(id, hash, sig);
      }

      // Log des vérifications pour debug
      console.log(`[VerifyQR] ID: ${id}, Hash match: ${hashValid}, Sig valid: ${sigValid}`);

      // Vérifier que l'acte est certifié sur la blockchain
      if (!birth.blockchainHash) {
        await this.logVerification(birth.id, ipAddress, verifierType, 'NOT_SYNCED');
        return { isValid: false, reason: 'Cet acte n\'est pas encore certifié sur la blockchain' };
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
          establishment: birth.establishment?.name ?? '—',
          ipfsUrl: birth.ipfsCid ? `https://gateway.pinata.cloud/ipfs/${birth.ipfsCid}` : null
        }
      };

    } catch (error) {
      console.error('[VerifyService] Erreur QR:', error.message);
      return { isValid: false, reason: 'Format du QR Code invalide' };
    }
  }

  /**
   * Vérifie un acte via son Identifiant National unique (Saisie manuelle)
   */
  async verifyFromNationalId(nationalId, ipAddress, verifierType) {
    console.log(`[VerifyService] Recherche acte: ${nationalId}`);
    let birth;
    try {
      birth = await prisma.birth.findUnique({
        where: { nationalId },
        include: { establishment: true }
      });

      console.log(`[VerifyService] Résultat recherche:`, birth ? 'Trouvé' : 'Non trouvé');

      if (!birth) {
        return { isValid: false, reason: 'Aucun acte trouvé avec cet identifiant national' };
      }
    } catch (error) {
      console.error(`[VerifyService] Erreur Prisma:`, error.message);
      throw error;
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
        establishment: birth.establishment?.name ?? '—',
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
      // Si pas d'identifiant, on ne peut pas logger
      if (!birthIdentifier) {
        console.log('[VerifyService] Pas d\'identifiant pour logger');
        return;
      }

      // Si l'ID passé est un nationalId (en cas d'échec de la DB), on essaie de trouver le vrai ID
      let birthId = birthIdentifier;
      if (typeof birthIdentifier === 'string' && birthIdentifier.startsWith('GN-')) {
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
