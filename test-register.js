require('dotenv').config();
const fetch = require('node-fetch');

const testCivitas = async () => {
  console.log('\n=== Testing CIVITAS Registration ===');
  const data = {
    name: 'Test Civitas',
    email: 'testcivitas@student.unsrat.ac.id',
    identifier: '22090999',
    password: 'password123',
    confirmPassword: 'password123'
  };

  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
};

const testUmum = async () => {
  console.log('\n=== Testing UMUM Registration ===');
  const data = {
    name: 'Test Umum User',
    email: 'testumum@example.com',
    identifier: '',
    password: 'password123',
    confirmPassword: 'password123'
  };

  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
};

const runTests = async () => {
  console.log('Waiting for server to be ready...');
  // Wait a bit for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testCivitas();
  await testUmum();
};

runTests();
