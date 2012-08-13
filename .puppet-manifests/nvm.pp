class nvm ($node_version) {

  Exec {
    path => ['/usr/local/bin','/usr/local/sbin','/usr/bin/','/usr/sbin','/bin','/sbin'],
  }

  exec { "set-node-version": 
    command => "bash -c \"source /home/vagrant/nvm/nvm.sh && nvm alias default ${node_version}\"",
    require => Exec["install-node"],
  }

  notify { "begin-install":
    message => "Starting to install node ${node_version}; this can take a while.",
    before => Exec["install-node"],
  }

  exec { "install-node": 
    command => "bash -c \"source /home/vagrant/nvm/nvm.sh && nvm install ${node_version}\"",
    require => Exec["clone-nvm"],
    timeout => 0,
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
    onlyif => "grep -q 'source /home/vagrant/nvm/nvm.sh' /home/vagrant/.bashrc; test $? -eq 1",
  }
}
