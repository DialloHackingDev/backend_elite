const PDFDocument = require('pdfkit');

/**
 * Génère le PDF de l'acte de naissance en mémoire
 * @param {Object} birthData - Les données de l'acte (avec ID National et QRCode)
 * @returns {Promise<Buffer>} - Le fichier PDF sous forme de Buffer
 */
const generateBirthCertificatePDF = (birthData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // --- Contenu du PDF ---
      doc.fontSize(20).text('RÉPUBLIQUE DE GUINÉE', { align: 'center' });
      doc.fontSize(12).text('Travail - Justice - Solidarité', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(24).text('ACTE DE NAISSANCE NUMÉRIQUE', { align: 'center', underline: true });
      doc.moveDown();

      doc.fontSize(14).text(`Numéro National Unique : ${birthData.nationalId}`, { align: 'center' });
      doc.moveDown(2);

      // Informations de l'enfant
      doc.fontSize(16).text('INFORMATIONS DE L\'ENFANT', { underline: true });
      doc.fontSize(12)
         .text(`Prénom(s) : ${birthData.childFirstName}`)
         .text(`Nom : ${birthData.childLastName}`)
         .text(`Sexe : ${birthData.childGender}`)
         .text(`Date de Naissance : ${new Date(birthData.dateOfBirth).toLocaleDateString()}`)
         .text(`Lieu de Naissance : ${birthData.placeOfBirth}`);
      doc.moveDown();

      // Parents
      doc.fontSize(16).text('FILIATION', { underline: true });
      doc.fontSize(12)
         .text(`Mère : ${birthData.motherFullName}`)
         .text(`Père : ${birthData.fatherFullName || 'Non renseigné'}`);
      doc.moveDown();

      // Signature et sécurité
      doc.fontSize(10).text(`Enregistré le : ${new Date().toLocaleString()}`);
      doc.text(`Hash Blockchain : ${birthData.blockchainHash || 'En attente...'}`);
      
      // Intégration du QR Code anti-falsification
      if (birthData.qrCodeDataURL) {
        doc.image(birthData.qrCodeDataURL, 400, 600, { width: 100 });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateBirthCertificatePDF
};
