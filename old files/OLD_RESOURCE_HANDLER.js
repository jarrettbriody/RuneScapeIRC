const fs = require('fs');

const index = fs.readFileSync(`${__dirname}/../hosted/client.html`);
const css = fs.readFileSync(`${__dirname}/../hosted/style.css`);
const font = fs.readFileSync(`${__dirname}/../hosted/runescape_uf.ttf`);
const jsBundle = fs.readFileSync(`${__dirname}/../hosted/bundle.js`);
const plus = fs.readFileSync(`${__dirname}/../hosted/plus.png`);
const minus = fs.readFileSync(`${__dirname}/../hosted/minus.png`);

// pass html to user
const getIndex = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

// pass css to user
const getCSS = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/css' });
  response.write(css);
  response.end();
};

// pass runescape font to user
const getFont = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'font/ttf' });
  response.write(font);
  response.end();
};

// pass javascript bundle to user
const getBundle = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'application/javascript' });
  response.write(jsBundle);
  response.end();
};

// pass plus image to user
const getPlus = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'image/png' });
  response.write(plus);
  response.end();
};

// pass minus image to user
const getMinus = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'image/png' });
  response.write(minus);
  response.end();
};

// send back error is webpage does not exist
const notFound = (request, response) => {
  response.writeHead(404, { 'Content-Type': 'application/json' });
  response.write(JSON.stringify({ message: 'The page you are looking for was not found.', id: 'notFound' }));
  response.end();
};

module.exports.getIndex = getIndex;
module.exports.getCSS = getCSS;
module.exports.getFont = getFont;
module.exports.getBundle = getBundle;
module.exports.getPlus = getPlus;
module.exports.getMinus = getMinus;
module.exports.notFound = notFound;
