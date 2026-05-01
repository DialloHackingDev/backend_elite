const Joi = require('joi');

const birthSchema = Joi.object({
  // Enfant
  childFirstName: Joi.string().required(),
  childLastName: Joi.string().required(),
  childGender: Joi.string().valid('M', 'F').required(),
  dateOfBirth: Joi.date().iso().required(),
  timeOfBirth: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  placeOfBirth: Joi.string().required(),

  // Mère
  motherFullName: Joi.string().required(),
  motherDob: Joi.date().iso().required(),
  motherCni: Joi.string().allow(null, '').optional(),
  motherPrefecture: Joi.string().required(),

  // Père
  fatherFullName: Joi.string().allow(null, '').optional(),
  fatherDob: Joi.date().iso().allow(null).optional(),
  fatherCni: Joi.string().allow(null, '').optional(),

  // Etablissement (sera lié via son code)
  establishmentCode: Joi.string().required(),
  
  // GPS optionnel
  gpsCoordinates: Joi.string().allow(null, '').optional(),

  // Enregistrement tardif
  isLateRegistration: Joi.boolean().default(false),
  witness1FullName: Joi.string().when('isLateRegistration', { is: true, then: Joi.required() }),
  witness1Cni: Joi.string().when('isLateRegistration', { is: true, then: Joi.required() }),
  witness2FullName: Joi.string().when('isLateRegistration', { is: true, then: Joi.required() }),
  witness2Cni: Joi.string().when('isLateRegistration', { is: true, then: Joi.required() }),
});

module.exports = {
  birthSchema
};
