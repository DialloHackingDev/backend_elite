const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('--- STARTING CITIZEN API TESTS ---');

  const citizenData = {
    nationalId: 'CNI-' + Math.floor(Math.random() * 1000000),
    firstName: 'Marie',
    lastName: 'Camara',
    password: 'password123',
    prefecture: 'Conakry'
  };

  try {
    // 1. Inscription Citoyen
    console.log('\n1. Testing Citizen Registration...');
    const regRes = await axios.post(`${BASE_URL}/auth/register`, citizenData);
    console.log('✅ Registration success:', regRes.data.message);

    // 2. Connexion Citoyen
    console.log('\n2. Testing Citizen Login...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      nationalAgentId: citizenData.nationalId,
      password: citizenData.password
    });
    const citizenToken = loginRes.data.data.accessToken;
    console.log('✅ Login success, token received.');

    // 3. Vérification liste enfants (vide au début)
    console.log('\n3. Checking initial children list...');
    const childrenRes = await axios.get(`${BASE_URL}/citizen/my-children`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    console.log('✅ List fetched:', childrenRes.data.data.length, 'children found (Expected 0)');

    // 4. Connexion Admin pour créer une naissance
    console.log('\n4. Logging in as Admin to create a birth...');
    const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      nationalAgentId: 'ADMIN-0001',
      password: 'admin123'
    });
    const adminToken = adminLoginRes.data.data.accessToken;
    console.log('✅ Admin login success.');

    // 5. Création d'une naissance liée au citoyen
    console.log('\n5. Registering a birth linked to the citizen...');
    const birthData = {
      establishmentCode: 'IGN-001',
      childFirstName: 'Amadou',
      childLastName: 'Camara',
      childGender: 'M',
      dateOfBirth: '2025-01-01',
      placeOfBirth: 'Conakry',
      motherFullName: 'Marie Camara',
      motherDob: '1995-05-10',
      motherCni: citizenData.nationalId, // LIEN ICI
      fatherFullName: 'Jean Camara',
      parentPhoneNumber: '+224600000000'
    };
    const birthRes = await axios.post(`${BASE_URL}/births`, birthData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Birth registered. ID:', birthRes.data.data.nationalId);

    // 6. Vérification liste enfants (doit en avoir 1)
    console.log('\n6. Checking children list again as citizen...');
    const childrenRes2 = await axios.get(`${BASE_URL}/citizen/my-children`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    console.log('✅ List fetched:', childrenRes2.data.data.length, 'children found (Expected 1)');
    const birthId = childrenRes2.data.data[0].id;

    // 7. Téléchargement PDF
    console.log('\n7. Testing PDF download...');
    const pdfRes = await axios.get(`${BASE_URL}/citizen/certificate/${birthId}`, {
      headers: { Authorization: `Bearer ${citizenToken}` },
      responseType: 'arraybuffer'
    });
    console.log('✅ PDF downloaded successfully. Size:', pdfRes.data.byteLength, 'bytes');

    console.log('\n--- ALL TESTS PASSED SUCCESSFULLY! ---');

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

runTests();
