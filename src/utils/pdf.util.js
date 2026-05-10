const PDFDocument = require('pdfkit');

/**
 * Génère le PDF de l'acte de naissance en mémoire - Design Officiel Guinéen
 * @param {Object} birthData - Les données de l'acte (avec ID National et QRCode)
 * @returns {Promise<Buffer>} - Le fichier PDF sous forme de Buffer
 */
const generateBirthCertificatePDF = (birthData) => {
  return new Promise((resolve, reject) => {
    try {
      // Format A4 paysage pour plus d'espace
      const doc = new PDFDocument({ 
        size: 'A4',
        layout: 'portrait',
        margin: 40 
      });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 40;
      const contentWidth = pageWidth - (margin * 2);

      // Couleurs officielles
      const colors = {
        primary: '#1a365d',      // Bleu foncé officiel
        secondary: '#2d5a27',    // Vert guinéen
        accent: '#c53030',         // Rouge tampon
        gold: '#d69e2e',         // Or armoiries
        text: '#1a202c',         // Texte noir
        lightGray: '#e2e8f0',    // Gris clair bordures
        headerBg: '#f7fafc'      // Fond en-tête
      };

      // === ARRIÈRE-PLAN DÉCORATIF ===
      // Bordure extérieure décorative
      doc.save();
      doc.lineWidth(3)
         .strokeColor(colors.primary)
         .rect(margin - 5, margin - 5, contentWidth + 10, pageHeight - (margin * 2) + 10)
         .stroke();
      
      // Bordure intérieure
      doc.lineWidth(1)
         .strokeColor(colors.secondary)
         .rect(margin, margin, contentWidth, pageHeight - (margin * 2))
         .stroke();
      doc.restore();

      // === EN-TÊTE OFFICIEL ===
      let y = margin + 15;
      
      // Logo/Emblème (cercle doré simulé)
      doc.save();
      doc.circle(pageWidth / 2, y + 25, 22)
         .fillColor(colors.gold)
         .fill();
      doc.circle(pageWidth / 2, y + 25, 18)
         .fillColor(colors.headerBg)
         .fill();
      doc.fontSize(10)
         .fillColor(colors.primary)
         .text('★', pageWidth / 2 - 6, y + 19);
      doc.restore();

      y += 55;

      // Titre officiel
      doc.font('Helvetica-Bold')
         .fontSize(11)
         .fillColor(colors.primary)
         .text('RÉPUBLIQUE DE GUINÉE', margin, y, { align: 'center', width: contentWidth });
      
      y += 16;
      doc.fontSize(9)
         .text('Travail - Justice - Solidarité', margin, y, { align: 'center', width: contentWidth });
      
      y += 20;
      doc.fontSize(18)
         .text('ACTE DE NAISSANCE', margin, y, { align: 'center', width: contentWidth });
      
      doc.fontSize(11)
         .text('Certificate of Birth', margin, y + 22, { align: 'center', width: contentWidth });

      // Ligne de séparation
      y += 45;
      doc.moveTo(margin + 50, y)
         .lineTo(pageWidth - margin - 50, y)
         .strokeColor(colors.gold)
         .lineWidth(2)
         .stroke();

      // === INFORMATIONS ADMINISTRATIVES ===
      y += 15;
      
      // Tableau d'informations
      const col1X = margin + 10;
      const col2X = margin + contentWidth / 2 + 10;
      
      doc.fontSize(9)
         .fillColor(colors.text);

      // Ligne Ville/Préfecture et Numéro
      doc.font('Helvetica-Bold').text('Ville / Préfecture :', col1X, y);
      doc.font('Helvetica').text(birthData.establishment?.prefecture || 'CONAKRY', col1X + 90, y);
      
      doc.font('Helvetica-Bold').text('N° Certificat :', col2X, y);
      doc.font('Helvetica').text(birthData.nationalId || '—', col2X + 65, y);
      
      y += 18;
      doc.font('Helvetica-Bold').text('Commune :', col1X, y);
      doc.font('Helvetica').text(birthData.establishment?.subPrefecture || '—', col1X + 55, y);
      
      doc.font('Helvetica-Bold').text('N° ID National :', col2X, y);
      doc.font('Helvetica').text(birthData.nationalId || '—', col2X + 75, y);

      // === SECTION ENFANT ===
      y += 20;
      _drawSectionHeader(doc, 'ENFANT', colors, margin, y, contentWidth);
      
      y += 18;
      const enfantData = [
        ['Prénom(s)', birthData.childFirstName || '—'],
        ['Nom', birthData.childLastName || '—'],
        ['Sexe', birthData.childGender === 'M' ? 'Masculin' : 'Féminin'],
        ['Date de Naissance', new Date(birthData.dateOfBirth).toLocaleDateString('fr-FR')],
        ['Lieu de Naissance', birthData.placeOfBirth || '—'],
        ['Nationalité', 'Guinéenne']
      ];
      y = _drawInfoTable(doc, enfantData, margin + 10, y, contentWidth - 20, colors);

      // === SECTION PÈRE ===
      y += 15;
      _drawSectionHeader(doc, 'PÈRE', colors, margin, y, contentWidth);
      
      y += 18;
      const pereData = [
        ['Nom', birthData.fatherFullName || 'Non renseigné'],
        ['Date de naissance', birthData.fatherDob ? new Date(birthData.fatherDob).toLocaleDateString('fr-FR') : '—'],
        ['Nationalité', 'Guinéenne']
      ];
      y = _drawInfoTable(doc, pereData, margin + 10, y, contentWidth - 20, colors);

      // === SECTION MÈRE ===
      y += 15;
      _drawSectionHeader(doc, 'MÈRE', colors, margin, y, contentWidth);
      
      y += 18;
         const mereData = [
            ['Nom', birthData.motherFullName || '—'],
            ['Date de naissance', birthData.motherDob ? new Date(birthData.motherDob).toLocaleDateString('fr-FR') : '—'],
            ['Nationalité', 'Guinéenne']
         ];
      y = _drawInfoTable(doc, mereData, margin + 10, y, contentWidth - 20, colors);

      // === DÉCLARANT ===
      y += 15;
      _drawSectionHeader(doc, 'DÉCLARANT', colors, margin, y, contentWidth);
      
      y += 18;
      doc.fontSize(8)
         .font('Helvetica')
         .text('Je soussigné certifie que les informations ci-dessus sont conformes à la réalité.', 
               margin + 10, y, { width: contentWidth - 20 });

      // === APPOUVÉ PAR ===
      y += 22;
      _drawSectionHeader(doc, 'APPROUVÉ PAR', colors, margin, y, contentWidth);
      
      y += 20;
      const agentName = (birthData.agent?.firstName && birthData.agent?.lastName) 
        ? `${birthData.agent.firstName} ${birthData.agent.lastName}`
        : 'Officier autorisé';
      
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .text('Officier de l\'État Civil :', margin + 10, y);
      
      doc.font('Helvetica')
         .text(agentName, margin + 110, y);

      // Date
      y += 18;
      doc.fontSize(8)
         .text(`Dressé le : ${new Date(birthData.createdAt || Date.now()).toLocaleDateString('fr-FR')}`, 
               margin + 10, y);

      // === PIED DE PAGE ===
      const footerY = pageHeight - margin - 75;
      
      // QR Code en bas à droite
      if (birthData.qrCodeDataURL) {
        try {
          const base64Data = birthData.qrCodeDataURL.replace(/^data:image\/\w+;base64,/, '');
          const imageBuffer = Buffer.from(base64Data, 'base64');
          
          doc.image(imageBuffer, pageWidth - margin - 85, footerY, { 
            width: 70,
            height: 70
          });
          
          // Légende QR
          doc.fontSize(7)
             .fillColor(colors.text)
             .text('Scanner pour vérifier', pageWidth - margin - 90, footerY + 75, 
                   { width: 80, align: 'center' });
        } catch (e) {
          console.log('Erreur QR Code PDF:', e.message);
        }
      }

      // Tampon digital simulé (à gauche)
      doc.save();
      const stampX = margin + 20;
      const stampY = footerY + 10;
      
      doc.circle(stampX + 30, stampY + 30, 28)
         .fillColor(colors.accent)
         .fillOpacity(0.1)
         .fill()
         .strokeColor(colors.accent)
         .lineWidth(2)
         .stroke();
      
      doc.fillOpacity(1)
         .fillColor(colors.accent)
         .fontSize(8)
         .text('VALIDÉ', stampX + 12, stampY + 25)
         .fontSize(6)
         .text('Numérique', stampX + 10, stampY + 38);
      doc.restore();

      // Mention légale (au centre, plus courte)
      doc.fontSize(6)
         .fillColor(colors.text)
         .text('Document numérique certifié blockchain - Vérifiez via QR code',
            margin + 70, footerY + 45,
            { width: contentWidth - 170, align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Fonction utilitaire pour dessiner les en-têtes de section
function _drawSectionHeader(doc, title, colors, x, y, width) {
  doc.save();
  
  // Fond coloré
  doc.fillColor(colors.secondary)
     .fillOpacity(0.1)
     .rect(x, y, width, 15)
     .fill();
  
  // Bordure
  doc.fillOpacity(1)
     .strokeColor(colors.secondary)
     .lineWidth(0.8)
     .rect(x, y, width, 15)
     .stroke();
  
  // Texte
  doc.fillColor(colors.primary)
     .font('Helvetica-Bold')
     .fontSize(9)
     .text(title, x + 6, y + 3, { width: width - 12 });
  
  doc.restore();
}

// Fonction utilitaire pour dessiner les tableaux d'informations
function _drawInfoTable(doc, data, x, y, width, colors) {
  const rowHeight = 14;
  const colWidth = width / 2;
  
  doc.save();
  
  data.forEach((row, index) => {
    const rowY = y + (index * rowHeight);
    
    // Bordure de cellule
    doc.strokeColor(colors.lightGray)
       .lineWidth(0.3)
       .rect(x, rowY, width, rowHeight)
       .stroke();
    
    // Label (colonne 1)
    doc.fillColor(colors.primary)
       .font('Helvetica-Bold')
       .fontSize(7)
       .text(row[0] + ' :', x + 4, rowY + 3, { width: colWidth - 8 });
    
    // Valeur (colonne 2)
    doc.fillColor(colors.text)
       .font('Helvetica')
       .fontSize(7)
       .text(row[1] || '—', x + colWidth + 4, rowY + 3, { width: colWidth - 8 });
  });
  
  doc.restore();
  
  return y + (data.length * rowHeight);
}

module.exports = {
  generateBirthCertificatePDF
};
