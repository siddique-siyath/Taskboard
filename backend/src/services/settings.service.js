const settingsRepo = require('../repositories/settings.repository');

const get = () => settingsRepo.get();
const update = (body) => settingsRepo.update(body);

module.exports = { get, update };
