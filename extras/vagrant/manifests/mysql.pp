class mysql::server {
  package { "mysql-server": ensure => installed; }
  package { "mysql-client": ensure => installed; }
  package { "libmysqlclient-dev": ensure => installed; }
}
