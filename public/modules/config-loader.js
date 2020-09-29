const globby = require("globby");
const fs = require("fs");

module.exports = {
  load: async () => {
    const paths = await globby(["*.cred", ".cred"], {
      absolute: true,
      unique: true,
      caseSensitiveMatch: false,
      expandDirectories: true,
      gitignore: false,
    });

    const latest = paths.pop();
    if (!latest) {
      console.debug("No config file to preload");
      return;
    }

    console.debug(`Preloading config file: ${latest}`);
    try {
      const data = fs.readFileSync(latest, { encoding: "utf8" });
      try {
        return JSON.parse(data);
      } catch (err) {
        console.warn("Failed to parse config file", err);
      }
    } catch (err) {
      console.error("Failed to read config file content", err);
    }
  },
};
