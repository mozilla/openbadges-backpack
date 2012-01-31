group { "puppet" :
  ensure => present,
  name => "puppet";
}

Exec {
  path => [
      '/usr/local/bin',
      '/usr/local/sbin',
      '/usr/bin/',
      '/usr/sbin',
      '/bin',
      '/sbin'],
  logoutput => true,
}

package {
  "curl":
    ensure => installed,
    before => Exec["download_node"];
  "libssl-dev":
    ensure => installed,
    before => Exec["install_node"];
  "git-core":
    ensure => installed;
  "nginx":
    ensure => installed,
    before => File['nginx-conf'];
  "python":
    ensure => installed;
  "build-essential":
    ensure => installed;
  "mysql-server":
    ensure => installed;
  "libmysqlclient-dev":
    ensure => installed;
}

service { 'nginx' :
  ensure => running,
  enable => true,
  hasrestart => true,
  subscribe => File['nginx-conf'],
}

file { "/etc/hostname":
  content => "openbadges";
}

file { "/home/vagrant/.bashrc":
  source => "/vagrant/manifests/openbadges.bashrc",
}

file { 'nginx-conf':
  path => "/etc/nginx/sites-enabled/default",
  source => "/vagrant/manifests/openbadges.nginx",
}

file { 'prepare-environment':
  path => "/usr/local/bin/prepare-environment",
  source => "/vagrant/manifests/prepare-environment",
  mode => 0755;
}

file { "/usr/local":
  recurse => true,
  group => "vagrant",
  owner => "vagrant";
}

file { "/usr/local/src":
  ensure => directory,
  group => "vagrant",
  owner => "vagrant";
}

define nodejs($version) {
  exec { "download_node":
    cwd => "/usr/local/src",
    command => "curl http://nodejs.org/dist/v$version/node-v$version.tar.gz | tar -xz",
    creates => "/usr/local/src/node-v$version",
    before => Exec["install_node"],
  }
  exec { "install_node":
    cwd => "/usr/local/src/node-v$version",
    command => "sh configure && make && make install",
    creates => "/usr/local/bin/node",
  }
}
 
nodejs { "install":
  version => "0.6.9",
}
