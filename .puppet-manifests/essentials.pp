class essentials {
  group { "puppet" :
    ensure => present,
    name => "puppet";
  }
  
  package {
    "curl":
      ensure => installed;
    "libssl-dev":
      ensure => installed;
    "git-core":
      ensure => installed;
    "python":
      ensure => installed;
    "build-essential":
      ensure => installed;
  }

  file { "/usr/local":
    recurse => true,
    group => "vagrant",
    owner => "vagrant";
  }
}
