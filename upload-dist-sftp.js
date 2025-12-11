import Client from 'ssh2-sftp-client';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const sftp = new Client();

const localDir = path.resolve('dist');
const remoteDir = process.env.SFTP_REMOTE_PATH;

// Путь к приватному ключу (по умолчанию ~/.ssh/id_rsa или можно указать свой)
// const privateKeyPath = process.env.SSH_PRIVATE_KEY_PATH || path.join(process.env.HOME || process.env.USERPROFILE, '.ssh', 'my-private-key');
const privateKeyPath = process.env.SSH_PRIVATE_KEY_PATH;

async function uploadDir(local, remote) {
  const files = fs.readdirSync(local);
  for (const file of files) {
    const localPath = path.join(local, file);
    const remotePath = remote + '/' + file;
    const stats = fs.statSync(localPath);
    if (stats.isDirectory()) {
      try {
        await sftp.mkdir(remotePath, true);
      } catch (err) {
        console.warn(`Папку не удалось создать (возможно, уже существует): ${remotePath}`, err.message);
      }
      await uploadDir(localPath, remotePath);
    } else {
      await sftp.fastPut(localPath, remotePath);
      console.log(`Uploaded: ${localPath} -> ${remotePath}`);
    }
  }
}

(async () => {
  let privateKey = null;
  try {
    // Читаем приватный ключ
    privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    console.log('🔑 Ключ загружен:', fs.existsSync(privateKeyPath)); // Для отладки
  } catch (err) {
    console.error(`❌ Не удалось прочитать приватный ключ по пути: ${privateKeyPath}`);
    console.error(err.message);
    process.exit(1);
  }

  try {
    await sftp.connect({
      host: process.env.SFTP_HOST,
      port: parseInt(process.env.SFTP_PORT) || 22,
      username: process.env.SFTP_USER,
      privateKey: privateKey,
      // Опционально: passphrase, если ключ защищён паролем
      // passphrase: process.env.SSH_PASSPHRASE || undefined,
    });

    await uploadDir(localDir, remoteDir);
    console.log('✅ Папка dist успешно опубликована по SFTP (через SSH-ключ)!');
  } catch (err) {
    console.error('❌ Ошибка публикации:', err.message || err);
    process.exit(1);
  } finally {
    await sftp.end().catch((e) => {
      console.warn('Предупреждение при закрытии соединения:', e.message);
    });
  }
})();
