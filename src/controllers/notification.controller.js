const prisma = require('../config/database');

exports.getNotifications = async (req, res) => {
  try {
    const citizenId = req.user.id;
    const notifications = await prisma.notification.findMany({
      where: { citizenId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.status(200).json({
      status: 'success',
      data: notifications
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    res.status(200).json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.sendToCitizen = async (req, res) => {
  try {
    const { citizenId, title, content, type, relatedId } = req.body;
    
    const notification = await prisma.notification.create({
      data: {
        citizenId,
        title,
        content,
        type: type || 'INFO',
        relatedId
      }
    });
    
    res.status(201).json({
      status: 'success',
      data: notification
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.listCitizens = async (req, res) => {
  try {
    const citizens = await prisma.citizen.findMany({
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        prefecture: true
      }
    });
    res.status(200).json({
      status: 'success',
      data: citizens
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.listAgents = async (req, res) => {
  try {
    const agents = await prisma.agent.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        nationalAgentId: true,
        prefectureAssignment: true
      }
    });
    res.status(200).json({
      status: 'success',
      data: agents
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
