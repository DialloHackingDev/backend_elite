const Joi = require('joi');

const birthSchema = Joi.object({
  // ── Enfant ────────────────────────────────────────────────────────────────
  childFirstName: Joi.string().trim().required(),
  childLastName:  Joi.string().trim().required(),
  childGender:    Joi.string().valid('M', 'F').required(),
  dateOfBirth:    Joi.date().iso().required(),
  timeOfBirth:    Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow(null, '').optional(),
  placeOfBirth:   Joi.string().trim().required(),

  // ── Mère ──────────────────────────────────────────────────────────────────
  motherFullName:  Joi.string().trim().required(),
  motherDob:       Joi.date().iso().required(),
  motherCni:       Joi.string().allow(null, '').optional(),
  motherPrefecture: Joi.string().trim().required(),

  // ── Père (tout optionnel) ─────────────────────────────────────────────────
  fatherFullName: Joi.string().allow(null, '').optional(),
  fatherDob:      Joi.date().iso().allow(null, '').optional(),
  fatherCni:      Joi.string().allow(null, '').optional(),

  // ── Établissement ─────────────────────────────────────────────────────────
  establishmentCode: Joi.string().trim().required(),

  // ── Divers ────────────────────────────────────────────────────────────────
  gpsCoordinates:    Joi.string().allow(null, '').optional(),
  parentPhoneNumber: Joi.string().allow(null, '').optional(),

  // ── Enregistrement tardif ─────────────────────────────────────────────────
  isLateRegistration: Joi.boolean().default(false),
  witness1FullName:   Joi.string().when('isLateRegistration', { is: true, then: Joi.required(), otherwise: Joi.allow(null, '').optional() }),
  witness1Cni:        Joi.string().when('isLateRegistration', { is: true, then: Joi.required(), otherwise: Joi.allow(null, '').optional() }),
  witness2FullName:   Joi.string().when('isLateRegistration', { is: true, then: Joi.required(), otherwise: Joi.allow(null, '').optional() }),
  witness2Cni:        Joi.string().when('isLateRegistration', { is: true, then: Joi.required(), otherwise: Joi.allow(null, '').optional() }),
});

module.exports = { birthSchema };
