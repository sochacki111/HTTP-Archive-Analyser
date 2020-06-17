
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');

const PORT = process.env.PORT || 5000;
const harAnalyzerRoutes = require('./routes/harAnalyzer');

app.set('view engine', 'ejs');

app.use(bodyParser.json({
  extended: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  res.locals.cookies = req.cookies;
  res.locals.testObject = req.testObject;
  next();
});
app.use('/', harAnalyzerRoutes);

app.listen(PORT, () => {
  console.log(`HTTP Archive Analyzer Server has started on port ${PORT}!`);
});