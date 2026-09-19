const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { Upload } = require('@aws-sdk/lib-storage');
const { S3Client } = require('@aws-sdk/client-s3');
const ApiError = require('../utils/ApiError');

const {
  S3_REGION,
  S3_ENDPOINT,
  S3_BUCKET,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  S3_PUBLIC_BASE_URL,
  NODE_ENV,
} = require('../config/env');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new ApiError(400, 'Only image files are allowed'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

const r2Client =
  S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY
    ? new S3Client({
        region: S3_REGION || 'auto',
        endpoint: S3_ENDPOINT,
        credentials: {
          accessKeyId: S3_ACCESS_KEY_ID,
          secretAccessKey: S3_SECRET_ACCESS_KEY,
        },
      })
    : null;

const PUBLIC_UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!r2Client) {
  fs.mkdirSync(PUBLIC_UPLOADS_DIR, { recursive: true });
}

const sanitizeExtension = (mimetype) => {
  switch (mimetype) {
    case 'image/jpeg':
    case 'image/jpg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/avif':
      return '.avif';
    default:
      return '.jpg';
  }
};

// Saves a single uploaded file (multer memory buffer) and returns its public URL.
const saveImage = async (file) => {
  const key = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${sanitizeExtension(file.mimetype)}`;

  if (r2Client && S3_BUCKET) {
    const upload = new Upload({
      client: r2Client,
      params: {
        Bucket: S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      },
    });
    await upload.done();
    const base = (S3_PUBLIC_BASE_URL || `${S3_ENDPOINT}/${S3_BUCKET}`).replace(/\/$/, '');
    return `${base}/${key}`;
  }

  if (NODE_ENV === 'production') {
    throw new ApiError(500, 'Image storage is not configured on the server');
  }

  // Local dev fallback: save under backend/uploads, served statically.
  const localPath = path.join(PUBLIC_UPLOADS_DIR, key);
  await fs.promises.writeFile(localPath, file.buffer);
  return `/uploads/${key}`;
};

const saveImages = async (files = []) => {
  const urls = [];
  for (const file of files) {
    urls.push(await saveImage(file));
  }
  return urls;
};

module.exports = { upload, saveImages, saveImage };