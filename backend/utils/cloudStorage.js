// cloudStorage.js

// Utility for uploading/deleting files from cloud storage (AWS S3, SDK v3)
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.AWS_S3_BUCKET;

export const uploadFileToCloud = async (file, key) => {
  const params = {
    Bucket: BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'private',
  };
  const command = new PutObjectCommand(params);
  await s3.send(command);
  // S3 URL format: https://<bucket>.s3.<region>.amazonaws.com/<key>
  const url = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${encodeURIComponent(key)}`;
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
