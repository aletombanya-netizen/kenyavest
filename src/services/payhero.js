const axios = require('axios');

const initiateSTKPush = async (amount, phone, reference) => {
  try {
    const response = await axios.post(
      'https://backend.payhero.co.ke/api/v2/payments',
      {
        amount: parseInt(amount),
        phone_number: phone,
        channel_id: parseInt(process.env.PAYHERO_CHANNEL_ID),
        provider: 'm-pesa',
        external_reference: reference,
        callback_url: 'https://kashflowvest.onrender.com/api/payments/callback',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.PAYHERO_API_KEY && {
            Authorization: process.env.PAYHERO_API_KEY.startsWith('Basic ')
              ? process.env.PAYHERO_API_KEY
              : `Basic ${Buffer.from(process.env.PAYHERO_API_KEY).toString('base64')}`,
          }),
        },
        ...(process.env.PAYHERO_API_USER && process.env.PAYHERO_API_PASS && {
          auth: {
            username: process.env.PAYHERO_API_USER,
            password: process.env.PAYHERO_API_PASS,
          },
        }),
      }
    );

    return response.data;
  } catch (error) {
    console.error('Payhero STK Push Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to initiate M-Pesa payment');
  }
};

module.exports = {
  initiateSTKPush,
};
