const agentService = require('../services/agent.service');

exports.createAgent = async (req, res) => {
  try {
    const newAgent = await agentService.createAgent(req.body);
    res.status(201).json({
      status: 'success',
      message: 'Agent créé avec succès',
      data: newAgent
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.getAgents = async (req, res) => {
  try {
    // Les filtres pourraient être gérés via req.query (ex: ?prefectureAssignment=Conakry)
    const filters = req.query;
    const agents = await agentService.getAgents(filters);
    res.status(200).json({
      status: 'success',
      data: agents
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.getAgentById = async (req, res) => {
  try {
    const agent = await agentService.getAgentById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: agent
    });
  } catch (error) {
    res.status(404).json({ status: 'error', message: error.message });
  }
};

exports.updateAgentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Statut invalide' });
    }

    const updatedAgent = await agentService.updateAgentStatus(req.params.id, status);
    res.status(200).json({
      status: 'success',
      message: 'Statut mis à jour',
      data: updatedAgent
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.updateAgent = async (req, res) => {
  try {
    const updatedAgent = await agentService.updateAgent(req.params.id, req.body);
    res.status(200).json({
      status: 'success',
      message: 'Agent mis à jour avec succès',
      data: updatedAgent
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.deleteAgent = async (req, res) => {
  try {
    await agentService.deleteAgent(req.params.id);
    res.status(200).json({
      status: 'success',
      message: 'Agent supprimé avec succès'
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};
