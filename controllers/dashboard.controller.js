const dashboardService = require('../services/dashboard.service');
const { Parser } = require('json2csv');

exports.getKPIs = async (req, res) => {
  try {
    const kpis = await dashboardService.getGlobalKPIs();
    res.status(200).json({ status: 'success', data: kpis });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getMapData = async (req, res) => {
  try {
    const data = await dashboardService.getBirthsByPrefecture();
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.exportCSV = async (req, res) => {
  try {
    const data = await dashboardService.getAllBirthsForExport();
    
    if (data.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Aucune donnée à exporter' });
    }

    const fields = ['nationalId', 'gender', 'dateOfBirth', 'placeOfBirth', 'status', 'establishmentName', 'prefecture', 'registeredAt'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment(`naissances_export_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);

  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Erreur lors de la génération du CSV' });
  }
};
