// upload-dist-sftp.js
import Client from 'ssh2-sftp-client';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const sftp = new Client();

const localDir = path.resolve('dist');
const remoteDir = process.env.SFTP_REMOTE_PATH;

async function uploadDir(local, remote) {
  const files = fs.readdirSync(local);
  for (const file of files) {
    const localPath = path.join(local, file);
    const remotePath = remote + '/' + file;
    const stats = fs.statSync(localPath);
    if (stats.isDirectory()) {
      try { await sftp.mkdir(remotePath, true); } catch {}
      await uploadDir(localPath, remotePath);
    } else {
      await sftp.fastPut(localPath, remotePath);
      console.log(`Uploaded: ${localPath} -> ${remotePath}`);
    }
  }
}

(async () => {
  try {
    await sftp.connect({
      host: process.env.SFTP_HOST,
      port: process.env.SFTP_PORT || 22,
      username: process.env.SFTP_USER,
      password: process.env.SFTP_PASS,
    });
    await uploadDir(localDir, remoteDir);
    console.log('✅ Папка dist успешно опубликована!');
  } catch (err) {
    console.error('Ошибка публикации:', err);
    process.exit(1);
  } finally {
    sftp.end();
  }
})();
