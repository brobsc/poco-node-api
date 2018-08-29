const fs = require('fs');
const md5 = require('md5');
const path = require('path');
const mkdirp = require('mkdirp');

const UPLOAD_DIR = process.env.POCO_UPLOAD_DIR || path.join(__dirname, '..', 'files');
const WORDS = process.env.POCO_WORDS || path.join(__dirname, '..', 'words.txt');
const words = fs.readFileSync(WORDS).toString().split('\n');

const helper = {
  // Given a file object from multer, move it to desired path
  saveFile(file) {
    const fileName = file.originalname;
    const fileContents = file.buffer;
    const hash = md5(fileContents);
    const filePath = path.join(UPLOAD_DIR, hash, fileName);
    mkdirp.sync(path.dirname(filePath));

    // TODO: Err before overwriting file
    fs.writeFileSync(filePath, fileContents);
    return filePath;
  },

  genReadableLink() {
    let result = '';
    for (let i = 0; i < 4; i += 1) {
      const r = Math.floor(Math.random() * words.length);
      const word = words[r].charAt(0).toUpperCase() + words[r].slice(1);
      result += word;
    }

    return result;
  },
};

module.exports = helper;
