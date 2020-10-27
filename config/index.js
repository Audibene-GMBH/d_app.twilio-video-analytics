const env = process.env.NODE_ENV || `development`;
const config_json_file = require(`./config.${env}.json`);

module.exports = {
    rfs: {
        api: `${config_json_file.rfs_url}`,
        cockpit_api: `${config_json_file.rfs_url}cockpit/api/`
    }
};