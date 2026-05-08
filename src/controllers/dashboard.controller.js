const dashboardService = require('../services/dashboard.service');
const { Parser } = require('json2csv');

exports.getKPIs = async (req, res) => {
  try {
    const kpis = await dashboardService.getGlobalKPIs();
    res.status(200).json({ 
      status: 'success', 
      data: kpis 
    });
  } catch (error) {
    console.error('Error in getKPIs:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
};

exports.getAgents = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const region = req.query.region || null;
    
    const agentsData = await dashboardService.getAgentsData(limit, offset, region);
    res.status(200).json({ 
      status: 'success', 
      data: agentsData 
    });
  } catch (error) {
    console.error('Error in getAgents:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
};

exports.getNetworkStatus = async (req, res) => {
  try {
    const networkData = await dashboardService.getNetworkStatus();
    res.status(200).json({ 
      status: 'success', 
      data: networkData 
    });
  } catch (error) {
    console.error('Error in getNetworkStatus:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
};

exports.getAuditLog = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const type = req.query.type || null;
    
    const auditData = await dashboardService.getAuditLog(limit, type);
    res.status(200).json({ 
      status: 'success', 
      data: auditData 
    });
  } catch (error) {
    console.error('Error in getAuditLog:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
};

exports.getMapData = async (req, res) => {
  try {
    const data = await dashboardService.getBirthsByPrefecture();
    res.status(200).json({ 
      status: 'success', 
      data 
    });
  } catch (error) {
    console.error('Error in getMapData:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
};

exports.exportCSV = async (req, res) => {
  try {
    const data = await dashboardService.getAllBirthsForExport();
    
    if (data.length === 0) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Aucune donnée à exporter' 
      });
    }

    const fields = ['nationalId', 'gender', 'dateOfBirth', 'placeOfBirth', 'status', 'establishmentName', 'prefecture', 'registeredAt'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment(`naissances_export_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);

  } catch (error) {
    console.error('Error in exportCSV:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Erreur lors de la génération du CSV' 
    });
  }
};
