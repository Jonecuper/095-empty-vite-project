import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const CLEAR_DEV_SCRIPTS = process.env.CLEAR_DEV_SCRIPTS === 'true'; // Удаляем dev-скрипты
const CREATE_PHP_FILE = process.env.CREATE_PHP_FILE === 'true'; // Создаем index.php
const APPLICATION_ENTRY_POINT_HTML_ID = process.env.APPLICATION_ENTRY_POINT_HTML_ID; // id HTML элемента точки входа в приложение


const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Пути
const indexPath = path.resolve(__dirname, 'dist', 'index.html');
const phpPath = path.resolve(__dirname, 'dist', 'index.php');

// Читаем index.html
fs.readFile(indexPath, 'utf8', async (err, data) => {
  if (err) {
    console.error('Ошибка чтения index.html:', err);
    return;
  }

  // Удаляем блоки между <!-- build-remove-start --> и <!-- build-remove-end -->
  const cleanedHtml = data.replace(/<!--\s*build-remove-start\s*-->[\s\S]*?<!--\s*build-remove-end\s*-->\s*/g, '');

  if (CLEAR_DEV_SCRIPTS) {
    // ✅ Записываем очищенную версию обратно в dist/index.html
    try {
      await fs.writeFile(indexPath, cleanedHtml, 'utf8');
      console.log('✅ dev-скрипты удалены из dist/index.html');
    } catch (writeErr) {
      console.error('Ошибка записи dist/index.html:', writeErr);
      return;
    }
  }

  if (CREATE_PHP_FILE) {
    // Парсим уже очищенный HTML
    const $ = cheerio.load(cleanedHtml);

    // Собираем только нужные теги в <head> (script и link)
    const headTags = $('head')
      .children()
      .filter((i, el) => {
        const tagName = $(el).prop('tagName');
        return tagName === 'SCRIPT' || tagName === 'LINK';
      })
      .map((i, el) => $(el).prop('outerHTML'))
      .get();

    // Извлекаем содержимое #empty-vite-project
    const bodyContent = $(`#${APPLICATION_ENTRY_POINT_HTML_ID}`).prop('outerHTML');

    // Формируем PHP-файл
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const formattedDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
      now.getSeconds()
    )}`;

    const phpContent = `
  <?php
  // Этот файл автоматически сгенерирован из dist/index.html
  // Дата и время генерации: ${formattedDate}
  ?>
  ${headTags.join('\n')}
  ${bodyContent}
  `.trim();

    // Сохраняем index.php
    try {
      await fs.writeFile(phpPath, phpContent, 'utf8');
      console.log('✅ index.php успешно создан!');
    } catch (err) {
      console.error('Ошибка записи index.php:', err);
    }
  }
});
