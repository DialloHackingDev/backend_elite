const prisma = require('../config/database');

class DashboardService {
  /**
   * Calcule les KPIs globaux pour le tableau de bord
   */
  async getGlobalKPIs() {
    const totalBirths = await prisma.birth.count();
    
    // Naissances par sexe
    const males = await prisma.birth.count({ where: { childGender: 'M' } });
    const females = await prisma.birth.count({ where: { childGender: 'F' } });

    // Naissances du mois en cours
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const birthsThisMonth = await prisma.birth.count({
      where: {
        createdAt: { gte: startOfMonth }
      }
    });

    // Alertes (ex: moins de X enregistrements ce mois-ci sur un objectif)
    // Ici, on fait une simulation d'alerte métier simple
    const expectedBirthsPerMonth = 5000;
    const coverageRate = totalBirths === 0 ? 0 : Math.round((birthsThisMonth / expectedBirthsPerMonth) * 100);
    const alert = coverageRate < 30 && startOfMonth.getDate() > 15 
      ? `Alerte: La couverture vaccinale/enregistrement est très faible ce mois-ci (${coverageRate}%).` 
      : null;

    return {
      totalBirths,
      birthsThisMonth,
      genderDistribution: {
        male: males,
        female: females
      },
      coverageRate,
      alert
    };
  }

  /**
   * Récupère la liste des préfectures avec leur nombre d'actes pour la cartographie
   */
  async getBirthsByPrefecture() {
    // On groupe par préfecture de l'établissement
    const stats = await prisma.birth.groupBy({
      by: ['placeOfBirth'], // Ou 'motherPrefecture' ou via 'establishment'
      _count: {
        id: true,
      },
    });

    // On transforme ça en données compatibles (ex: GeoJSON properties)
    return stats.map(stat => ({
      prefecture: stat.placeOfBirth,
      count: stat._count.id
    }));
  }

  /**
   * Exporte toutes les naissances pour analyse CSV
   */
  async getAllBirthsForExport() {
    const births = await prisma.birth.findMany({
      select: {
        nationalId: true,
        childGender: true,
        dateOfBirth: true,
        placeOfBirth: true,
        status: true,
        createdAt: true,
        establishment: {
          select: { name: true, prefecture: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Aplatissement des données
    return births.map(b => ({
      nationalId: b.nationalId,
      gender: b.childGender,
      dateOfBirth: b.dateOfBirth.toISOString().split('T')[0],
      placeOfBirth: b.placeOfBirth,
      status: b.status,
      establishmentName: b.establishment.name,
      prefecture: b.establishment.prefecture,
      registeredAt: b.createdAt.toISOString()
    }));
  }
}

module.exports = new DashboardService();
