const birthService = require('../services/birth.service');
const prisma = require('../config/database');
const { enqueueSyncJob } = require('../jobs/sync.queue');

// Liste paginée des naissances (agent voit les siennes, admin voit tout)
exports.getBirths = async (req, res) => {
  try {
    const agentId = req.user.id;
    const role = req.user.role;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    const where = role === 'AGENT' ? { agentId } : {};

    const [births, total] = await Promise.all([
      prisma.birth.findMany({
        where,
        select: {
          id: true,
          nationalId: true,
          childFirstName: true,
          childLastName: true,
          childGender: true,
          dateOfBirth: true,
          placeOfBirth: true,
          status: true,
          validationStatus: true,
          blockchainHash: true,
          isLateRegistration: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.birth.count({ where }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        births,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.registerBirth = async (req, res) => {
  try {
    const agentId = req.user.id;
    const payload = req.body;

    const newBirth = await birthService.registerBirth(payload, agentId);

    res.status(201).json({
      status: 'success',
      message: 'Acte de naissance enregistré avec succès sur la blockchain.',
      data: {
        id: newBirth.id,
        nationalId: newBirth.nationalId,
        blockchainHash: newBirth.blockchainHash,
        ipfsCid: newBirth.ipfsCid,
        status: newBirth.status,
      },
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.getBirth = async (req, res) => {
  try {
    const { nationalId } = req.params;
    const birth = await birthService.getBirthByNationalId(nationalId);
    res.status(200).json({ status: 'success', data: birth });
  } catch (error) {
    res.status(404).json({ status: 'error', message: error.message });
  }
};

exports.syncBirths = async (req, res) => {
  try {
    const agentId = req.user.id;
    const { births } = req.body;

    if (!Array.isArray(births) || births.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Aucune donnée fournie pour la synchronisation' });
    }

    // Enregistrer chaque acte et l'envoyer en file d'attente
    const results = [];
    for (const birthPayload of births) {
      const newBirth = await birthService.registerBirth(birthPayload, agentId);
      await enqueueSyncJob(newBirth.id, birthPayload.parentPhoneNumber);
      results.push({ localId: birthPayload.localId, serverId: newBirth.id, nationalId: newBirth.nationalId });
    }

    res.status(202).json({
      status: 'success',
      message: `${births.length} acte(s) synchronisé(s) avec succès.`,
      data: results,
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getPendingBirths = async (req, res) => {
  try {
    const pending = await birthService.getPendingRegistrations();
    res.status(200).json({ status: 'success', data: pending });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.validateBirth = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision } = req.body;
    const adminId = req.user.id;

    const result = await birthService.validateLateRegistration(id, decision, adminId);

    res.status(200).json({
      status: 'success',
      message: `L'acte a été ${decision === 'APPROVED' ? 'approuvé et enregistré sur la blockchain' : 'rejeté'}.`,
      data: result,
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};
