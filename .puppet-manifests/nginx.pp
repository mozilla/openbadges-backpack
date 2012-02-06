class nginx {
  package { "nginx":
    ensure => installed,
    before => File['nginx-conf'];
  }
  
  service { 'nginx' :
    ensure => running,
    enable => true,
    hasrestart => true,
    subscribe => File['nginx-conf'],
  }

  file { 'nginx-conf':
    path => "/etc/nginx/sites-enabled/default",
    source => "/tmp/vagrant-puppet/manifests/files/nginx.conf",
  }
}
