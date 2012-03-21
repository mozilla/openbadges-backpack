node lucid32 {
  exec { 'apt-get update':
    command => '/usr/bin/apt-get update'
  }
  include essentials
  include mysql::server
  include openbadges::db
  include nginx
  include nodejs
  include openbadges::app
}
