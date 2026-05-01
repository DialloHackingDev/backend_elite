const birthService = require('../services/birth.service');

exports.registerBirth = async (req, res) => {
  try {
    const agentId = req.user.id;
    const payload = req.body;

    const newBirth = await birthService.registerBirth(payload, agentId);

    res.status(201).json({
      status: 'success',
      message: 'Acte de naissance enregistré avec succès sur la blockchain.',
      data: {
        nationalId: newBirth.nationalId,
        blockchainHash: newBirth.blockchainHash,
        ipfsCid: newBirth.ipfsCid
      }
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.getBirth = async (req, res) => {
  try {
    const { nationalId } = req.params;
    const birth = await birthService.getBirthByNationalId(nationalId);

    res.status(200).json({
      status: 'success',
      data: birth
    });
  } catch (error) {
    res.status(404).json({ status: 'error', message: error.message });
  }
};

const { enqueueSyncJobs } = require('../jobs/sync.queue');

exports.syncBirths = async (req, res) => {
  try {
    const agentId = req.user.id;
    const { births } = req.body; // Array of offline births

    if (!Array.isArray(births) || births.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Aucune donnée fournie pour la synchronisation' });
    }

    await enqueueSyncJobs(births, agentId);

    res.status(202).json({
      status: 'success',
      message: `${births.length} acte(s) mis en file d'attente pour synchronisation asynchrone.`
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
      data: result
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};
