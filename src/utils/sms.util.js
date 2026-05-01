const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// N'initialiser Twilio que si les clés sont présentes
let client;
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

/**
 * Envoie un message SMS via Twilio
 * @param {string} to - Numéro de téléphone (ex: +224620000000)
 * @param {string} body - Contenu du message
 */
const sendSMS = async (to, body) => {
  if (!client) {
    console.warn('⚠️ Twilio non configuré. Simulation de SMS pour:', to);
    console.log(`[SMS_SIMULATION] To: ${to} | Message: ${body}`);
    return { status: 'simulated' };
  }

  try {
    const message = await client.messages.create({
      body: body,
      from: twilioPhoneNumber,
      to: to
    });
    return message;
  } catch (error) {
    console.error('Erreur lors de l\'envoi du SMS:', error.message);
    throw error;
  }
};

/**
 * Envoie un message WhatsApp via Twilio
 */
const sendWhatsApp = async (to, body) => {
  if (!client) {
    console.warn('⚠️ Twilio non configuré. Simulation de WhatsApp pour:', to);
    console.log(`[WHATSAPP_SIMULATION] To: ${to} | Message: ${body}`);
    return { status: 'simulated' };
  }

  try {
    const message = await client.messages.create({
      body: body,
      from: `whatsapp:${twilioPhoneNumber}`,
      to: `whatsapp:${to}`
    });
    return message;
  } catch (error) {
    console.error('Erreur lors de l\'envoi du WhatsApp:', error.message);
    throw error;
  }
};

module.exports = {
  sendSMS,
  sendWhatsApp
};
