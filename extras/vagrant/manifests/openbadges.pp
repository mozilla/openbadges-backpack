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
    before => [ Exec["download_mongo"], Exec["download_node"] ];
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
  "python-dev":
    ensure => installed;
  "python-pip":
    ensure => installed;
  "python-setuptools":
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

# using the file declaration causes puppet to hang
exec { "reclaim_local":
  command => "chown -R vagrant:vagrant /usr/local",
  before => [Exec["download_node"], ]

}

define nodejs($version) {
  exec { "download_node":
    cwd => "/usr/local/src",
    command => "curl http://nodejs.org/dist/node-v$version.tar.gz | tar -xz",
    creates => "/usr/local/src/node-v$version",
    before => Exec["install_node"],
  }
  exec { "install_node":
    cwd => "/usr/local/src/node-v$version",
    command => "./configure && make && make install",
    creates => "/usr/local/bin/node",
  }
}
 
nodejs { "install":
  version => "0.6.8",
}
