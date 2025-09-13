import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// Configure AWS
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
  });
}

export const s3 = process.env.AWS_ACCESS_KEY_ID ? new AWS.S3() : null;

export const uploadConfig = {
  bucket: process.env.AWS_S3_BUCKET || 'telehealth-files',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
};

export function generateStoragePath(userId, consultationId, filename) {
  const extension = filename.split('.').pop();
  const uniqueId = uuidv4();
  return `consultations/${consultationId}/${userId}/${uniqueId}.${extension}`;
}

export async function uploadToS3(buffer, key, mimeType) {
  if (!s3) {
    throw new Error('AWS S3 not configured');
  }
  
  const params = {
    Bucket: uploadConfig.bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ServerSideEncryption: 'AES256'
  };

  const result = await s3.upload(params).promise();
  return result.Location;
}

export function getSignedUrl(key, expiresIn = 3600) {
  if (!s3) {
    throw new Error('AWS S3 not configured');
  }
  
  return s3.getSignedUrl('getObject', {
    Bucket: uploadConfig.bucket,
    Key: key,
    Expires: expiresIn
  });
}
