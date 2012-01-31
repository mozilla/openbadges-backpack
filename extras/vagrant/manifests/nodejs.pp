class nodejs {
  Exec {
    path => ['/usr/local/bin','/usr/local/sbin','/usr/bin/','/usr/sbin','/bin','/sbin'],
  }
  
  exec { "update-apt":
    command => "apt-get -y update && apt-get -y install python-software-properties && add-apt-repository ppa:chris-lea/node.js && apt-get update",
  }
  
  package {
    "nodejs":
      ensure => installed,
      require => Exec["update-apt"];
    "nodejs-dev":
      ensure => installed,
      require => Exec["update-apt"];
    "npm":
      ensure => installed,
      require => Exec["update-apt"];
  }
}
