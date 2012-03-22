Vagrant::Config.run do |config|
  config.vm.box = "lucid32"
  
  config.vm.box_url = "http://files.vagrantup.com/lucid32.box"
  
  config.vm.share_folder "srv", "/home/vagrant/openbadges", "."
  
  config.vm.network :hostonly,  '33.33.33.11'
  
  config.vm.forward_port 22, 2229
  
  config.vm.forward_port 80, 8888
  
  config.vm.forward_port 8889, 8889
  
  config.vm.provision :puppet do |puppet|
    puppet.manifests_path = ".puppet-manifests"
    puppet.manifest_file  = "nodes.pp"
  end
end
