const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { corsOrigin } = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '100kb' }));
app.use(routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
