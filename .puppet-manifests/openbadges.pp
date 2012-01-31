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
  mysqldb { "openbadges_testing":
    user => "badgemaker",
    password => "secret",
  }  
}

class openbadges::app {
  file { "node-modules": 
    path => "/home/vagrant/.node_modules",
    ensure => directory,
  }
  file { "node-modules-link":
    path => "/home/vagrant/.node_modules",
    target => "/home/vagrant/openbadges/node_modules",
    ensure => link,
    require => File['node-modules'],
  }
  exec { "npm-install-packages":
    cwd => "/home/vagrant/openbadges",
    command => "npm install .",
    require => File["node-modules-link"],
  }
}
