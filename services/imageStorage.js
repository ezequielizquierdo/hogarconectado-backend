const cloudinary = require('cloudinary').v2;

const configureCloudinary = () => {
  if (process.env.CLOUDINARY_URL) {
    const match = process.env.CLOUDINARY_URL.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
    if (!match) return false;
    cloudinary.config({ api_key: decodeURIComponent(match[1]), api_secret: decodeURIComponent(match[2]), cloud_name: decodeURIComponent(match[3]), secure: true });
    return true;
  }
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return false;
  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, secure: true });
  return true;
};

const isConfigured = configureCloudinary();
const options = { folder: 'hogar-conectado/productos', resource_type: 'image', transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }] };

const uploadDataUri = async (dataUri, filename) => {
  if (!isConfigured) throw new Error('Cloudinary no está configurado');
  const result = await cloudinary.uploader.upload(dataUri, { ...options, public_id: filename ? filename.replace(/\.[^.]+$/, '') : undefined, overwrite: false });
  return { url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height, bytes: result.bytes };
};

const uploadBuffer = buffer => new Promise((resolve, reject) => {
  if (!isConfigured) return reject(new Error('Cloudinary no está configurado'));
  const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
    if (error) return reject(error);
    resolve({ url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height, bytes: result.bytes });
  });
  stream.end(buffer);
});

const deleteAsset = async publicId => {
  if (!isConfigured || !publicId) return false;
  const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
  return result.result === 'ok' || result.result === 'not found';
};

const deleteAssets = publicIds => Promise.allSettled((publicIds || []).filter(Boolean).map(deleteAsset));

module.exports = { isConfigured, uploadDataUri, uploadBuffer, deleteAsset, deleteAssets };
