const express = require('express');
const filesRouter = require('./files');

const PORT = process.env.PORT || 8095;
const app = express();

app.use('/files', filesRouter);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(PORT, () => console.log(`Listening at http://localhost:${PORT}`));
