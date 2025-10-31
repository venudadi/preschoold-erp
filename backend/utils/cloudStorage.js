// cloudStorage.js

// Utility for uploading/deleting files from cloud storage (AWS S3 / DigitalOcean Spaces, SDK v3)
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Configure S3 client - supports both AWS S3 and DigitalOcean Spaces
const s3Config = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

// If using DigitalOcean Spaces, add custom endpoint
if (process.env.AWS_ENDPOINT) {
  s3Config.endpoint = process.env.AWS_ENDPOINT;
  s3Config.forcePathStyle = false; // Spaces uses virtual-hosted-style URLs
}

const s3 = new S3Client(s3Config);
const BUCKET = process.env.AWS_S3_BUCKET;

export const uploadFileToCloud = async (file, key) => {
  const params = {
    Bucket: BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read', // Make files publicly readable (adjust based on your security needs)
  };
  const command = new PutObjectCommand(params);
  await s3.send(command);

  // Generate appropriate URL based on storage provider
  let url;
  if (process.env.AWS_ENDPOINT) {
    // DigitalOcean Spaces URL format: https://<bucket>.<region>.digitaloceanspaces.com/<key>
    // OR if CDN enabled: https://<bucket>.<region>.cdn.digitaloceanspaces.com/<key>
    const endpoint = process.env.AWS_ENDPOINT.replace('https://', '');
    url = `https://${BUCKET}.${endpoint}/${encodeURIComponent(key)}`;
  } else {
    // AWS S3 URL format: https://<bucket>.s3.<region>.amazonaws.com/<key>
    url = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${encodeURIComponent(key)}`;
  }

  return { url };
};

export const deleteFileFromCloud = async (fileUrl) => {
  // Extract key from URL
  const url = new URL(fileUrl);
  const key = decodeURIComponent(url.pathname.substring(1));
  const params = {
    Bucket: BUCKET,
    Key: key,
  };
  const command = new DeleteObjectCommand(params);
  return await s3.send(command);
};
