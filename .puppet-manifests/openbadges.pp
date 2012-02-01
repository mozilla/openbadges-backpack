class openbadges::db {  
  define mysqldb( $user, $password ) {
    exec { "create-${name}-db":
      unless => "/usr/bin/mysql -u${user} -p${password} ${name}",
      command => "/usr/bin/mysql -uroot -p$mysql_password -e \"create database ${name}; grant all on ${name}.* to ${user}@localhost identified by '$password';\"",
    }
  }
  mysqldb { "openbadges":
    user => "badgemaker",
    password => "secret",
  }  
  mysqldb { "openbadges_test":
    user => "badgemaker",
    password => "secret",
  }  
}

class openbadges::app {
  Exec { path => ['/usr/local/bin','/usr/local/sbin','/usr/bin/','/usr/sbin','/bin','/sbin'], }
  
  define npm( $directory=true ) {
    exec { "install-${name}-npm-package":
      unless => "test -d $directory/$name",
      command => "npm install -g $name",
      require => Package['npm'],
    }
  }
  
  npm { "vows": }
  
  npm { "up": }
  
  file { "package.json":
    path => "/home/vagrant/package.json",
    source => "/home/vagrant/openbadges/package.json",
    before => Exec['npm-install-packages'],
  }
  
  exec { "npm-install-packages":
    cwd => "/home/vagrant/",
    command => "npm install .",
    require => Package['npm'],
  }
  
  file { "copy-local-dist":
    path => "/home/vagrant/openbadges/lib/environments/local.js",
    source => "/home/vagrant/openbadges/lib/environments/local-dist.js",
  }
}
