import fs from 'fs';
export const createUploadFolder = (folderName: string = 'uploads') => {
  try {
    fs.readdirSync(folderName);
  } catch (error) {
    fs.mkdirSync(folderName);
  }
};
