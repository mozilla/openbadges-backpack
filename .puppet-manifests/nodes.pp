node lucid32 {

  include aptupdate
  include essentials
  include mysql::server
  include openbadges::db
  include nginx

  $node_version = "v0.6.20"
  class { 'nvm':
    node_version => $node_version,
  }
  class{ 'openbadges::app':
    node_version => $node_version,
  }
}
