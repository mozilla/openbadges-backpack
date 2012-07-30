class nvm {
  Exec {
    path => ['/usr/local/bin','/usr/local/sbin','/usr/bin/','/usr/sbin','/bin','/sbin'],
  }

  exec { "default-node-version": 
    command => "bash -c \"source /home/vagrant/nvm/nvm.sh && nvm alias default v0.6.14\"",
    require => Exec["install-node-version"],
  }

  exec { "install-node-version": 
    command => "bash -c \"source /home/vagrant/nvm/nvm.sh && nvm install v0.6.14\"",
    require => Exec["clone-nvm"],
  }

  exec { "clone-nvm":
    command => "git clone git://github.com/creationix/nvm.git /home/vagrant/nvm",
    user => "vagrant",
    group => "vagrant",
    creates => "/home/vagrant/nvm/nvm.sh",
    require => Package["git-core"],
  }

  exec { "source-nvm":
    command => "echo 'source /home/vagrant/nvm/nvm.sh' >> /home/vagrant/.bashrc",
  }
}
