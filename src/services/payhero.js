const axios = require('axios');

const initiateSTKPush = async (amount, phone, reference) => {
  try {
    const response = await axios.post(
      'https://api.payhero.co.ke/v1/charge',
      {
        amount: parseInt(amount),
        phone_number: phone,
        channel_id: parseInt(process.env.PAYHERO_CHANNEL_ID),
        provider: 'm-pesa',
        external_reference: reference,
        callback_url: 'https://your-domain.com/api/payments/callback', // TODO: Update with real domain in production
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${process.env.PAYHERO_API_KEY}`,
        },
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
