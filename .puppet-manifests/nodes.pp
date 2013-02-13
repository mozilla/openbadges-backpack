node lucid32 {
  include aptupdate
  include essentials
  include mysql::server
  include openbadges::db
  include nginx
  
  Package { require => Exec['apt-get update'] }
  
  $node_version = "v0.8.19"
  class { 'nvm':
    node_version => $node_version,
  }
  class{ 'openbadges::app':
    node_version => $node_version,
  }
}
