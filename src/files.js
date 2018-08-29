const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const helper = require('./helper');

const API_KEY = process.env.POCO_API_KEY || 'obaoba';
const upload = multer();
const router = express.Router();
const TEMP_GLOBAL = {}; // TODO: Implement persistent database

router.use(bodyParser.json()); // for parsing application/json

router.all('*', (req, res, next) => {
  res.type('json');
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authentication, Content-Type',
  });
  next();
});

router.options('/', (req, res) => {
  res.sendStatus(200);
});

router.post('/', upload.single('file'), async (req, res) => {
  const response = {
    status: 'Invalid API Key',
    download_link: '',
    delete_secret: '',
  };

  if (req.get('Authentication') !== API_KEY) {
    res.status(401).send(response);
    return;
  }

  const filePath = helper.saveFile(req.file);
  const dlLink = helper.genReadableLink();

  // Gen delete secret
  const delSecret = Math.floor(Math.random() * 0xffffff).toString(16);

  response.status = 'Upload OK';
  response.download_link = dlLink;
  response.delete_secret = delSecret;
  TEMP_GLOBAL[dlLink] = { path: filePath, delete_secret: delSecret };
  res.location = `/files/${dlLink}`;
  res.status(201).send(response);
});

function checkFileId(req, res, next) {
  const { id } = req.params;

  if (!(id in TEMP_GLOBAL)) {
    res.send({ status: 'Invalid file' });
    return;
  }

  res.locals.fileObject = TEMP_GLOBAL[id];
  res.locals.id = id;
  res.locals.fileObject.name = path.basename(res.locals.fileObject.path);
  res.locals.validDeleteSecret = (req.get('Authentication') === res.locals.fileObject.delete_secret) || false;
  next();
}

// Match any route starting with ID, and use checkFileId middleware
router.all('/:id*', checkFileId);

router.options('/:id', (req, res) => {
  res.set({
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Expose-Headers': 'Access-Control-Allow-Methods',
  });

  if (res.locals.validDeleteSecret) {
    res['Access-Control-Allow-Methods'] += ', DELETE';
    console.log('Can delete');
  }

  res.sendStatus(200);
});

router.get('/:id', (req, res) => {
  const { name } = res.locals.fileObject;

  res.send({ name });
});

router.get('/:id/download', (req, res) => {
  const { name } = res.locals.fileObject;
  // TODO: send correct file mimetype through res.attachment();
  res.type('html'); // supress frontend mimetype mismatch

  res.download(res.locals.fileObject.path, name);
});

router.delete('/:id', (req, res) => {
  if (!res.locals.validDeleteSecret) {
    res.status(401).send({ error: 'Invalid deletion secret' });
  }

  // TODO: DELETE FILE
  res.sendStatus(202);
});

module.exports = router;
