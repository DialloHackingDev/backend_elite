const requestService = require('../services/request.service');

exports.getMyRequests = async (req, res) => {
  try {
    const citizenId = req.user.id;
    const requests = await requestService.getRequestsByCitizen(citizenId);
    
    res.status(200).json({
      status: 'success',
      data: requests
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.createRequest = async (req, res) => {
  try {
    const citizenId = req.user.id;
    const requestData = { ...req.body, citizenId };
    
    const newRequest = await requestService.createRequest(requestData);
    
    res.status(201).json({
      status: 'success',
      message: 'Demande créée avec succès',
      data: newRequest
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.getRequestDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const citizenId = req.user.id;
    
    const request = await requestService.getRequestDetails(id, citizenId);
    
    res.status(200).json({
      status: 'success',
      data: request
    });
  } catch (error) {
    res.status(404).json({ status: 'error', message: error.message });
  }
};

exports.cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const citizenId = req.user.id;
    
    await requestService.cancelRequest(id, citizenId);
    
    res.status(200).json({
      status: 'success',
      message: 'Demande annulée avec succès'
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const agentId = req.user.role === 'ADMIN' || req.user.role === 'MINISTRY' ? null : req.user.id;
    const requests = await requestService.getPendingRequests(agentId);
    res.status(200).json({
      status: 'success',
      data: requests
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const agentId = req.user.id;
    
    // Si la route est toujours appelée (pour le rejet par exemple)
    const request = await requestService.processRequest(id, agentId, status, notes);
    
    res.status(200).json({
      status: 'success',
      data: request
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.validateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const agentId = req.user.id;
    
    const result = await requestService.validateFamilyRequest(id, agentId, req.body);
    
    res.status(200).json({
      status: 'success',
      message: 'Demande validée, acte de naissance généré.',
      data: result
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};
