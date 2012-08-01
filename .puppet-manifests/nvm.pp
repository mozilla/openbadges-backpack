class nvm ($node_version) {

  Exec {
    path => ['/usr/local/bin','/usr/local/sbin','/usr/bin/','/usr/sbin','/bin','/sbin'],
  }

  exec { "set-node-version": 
    command => "bash -c \"source /home/vagrant/nvm/nvm.sh && nvm alias default ${node_version}\"",
    require => Exec["install-node"],
  }

  exec { "install-node": 
    command => "bash -c \"source /home/vagrant/nvm/nvm.sh && nvm install ${node_version}\"",
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
