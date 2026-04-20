const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { randomUUID } = require('crypto');
const path = require('path');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function getS3Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

async function presignUpload(req, res, next) {
  try {
    const { filename, contentType, size } = req.body;

    if (!ALLOWED_TYPES.includes(contentType)) {
      return res.status(400).json({ message: 'Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.' });
    }
    if (size > MAX_SIZE) {
      return res.status(400).json({ message: 'Arquivo muito grande. Máximo 5MB.' });
    }

    const ext = path.extname(filename) || '.jpg';
    const key = `profile-photos/${req.doctorId}/${randomUUID()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 300 });
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    res.json({ uploadUrl, publicUrl, key });
  } catch (err) {
    next(err);
  }
}

module.exports = { presignUpload };