var Habitat = require("habitat");
var default_env = new Habitat();
var env = new Habitat("openbadges");
var Path = require("path");

module.exports = {
  config: {
    protocol: env.get("protocol"),
    hostname: env.get("hostname"),
    port: default_env.get("port"),
    force_https: env.get("force_https"),
    remote_port: env.get("remote_port"),
    var_path: Path.resolve(env.get("var_path")),
    badge_path: Path.resolve(env.get("badge_path")),
    admins: env.get("admins"),
    database: env.get("database"),
    identity: env.get("identity"),
    less: env.get("less"),
    nunjucks_precompiled: env.get("nunjucks_precompiled"),
    new_relic: env.get("new_relic")
  }
};
