import fs from 'fs';
import path from 'path';
export const createUploadFolder = (folderName: string = 'uploads') => {
  const filePath = folderName.split('/');
  let currentPath = '';
  for (const folder of filePath) {
    currentPath = currentPath ? path.join(currentPath, folder) : folder;
    try {
      fs.readdirSync(folderName);
    } catch (error) {
      fs.mkdirSync(folderName);
    }
  }
};
