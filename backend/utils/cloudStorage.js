// cloudStorage.js
// Utility for uploading/deleting files from cloud storage (e.g., AWS S3)


import AWS from 'aws-sdk';
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const BUCKET = process.env.AWS_S3_BUCKET;


export const uploadFileToCloud = (file, key) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private',
    };
    s3.upload(params, (err, data) => {
      if (err) return reject(err);
      resolve({ url: data.Location });
    });
  });
};

export const deleteFileFromCloud = (fileUrl) => {
  return new Promise((resolve, reject) => {
    // Extract key from URL
    const url = new URL(fileUrl);
    const key = decodeURIComponent(url.pathname.substring(1));
    s3.deleteObject({ Bucket: BUCKET, Key: key }, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
};
