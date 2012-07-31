node lucid32 {

  exec { 'apt-get update':
    command => '/usr/bin/apt-get update'
  }
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
