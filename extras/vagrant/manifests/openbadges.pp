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

