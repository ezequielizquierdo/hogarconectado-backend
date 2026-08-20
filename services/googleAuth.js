const { OAuth2Client } = require('google-auth-library');

let client;

function getGoogleClient() {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID no está configurado');
  }
  client ||= new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  return client;
}

async function verifyGoogleCredential(credential) {
  const ticket = await getGoogleClient().verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID
  });
  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.email || !payload.email_verified) {
    throw new Error('La cuenta de Google no tiene un correo verificado');
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    nombre: payload.name || payload.email,
    foto: payload.picture
  };
}

module.exports = { verifyGoogleCredential };
