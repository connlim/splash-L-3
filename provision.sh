#!/bin/bash

# Because cowsay
echo "Installing cowsay"
apt-get install -y cowsay
export PATH=$PATH:/usr/games:/usr/local/games

cowsay "Hello there! This provisioning procedure will only run once. It may take a while, so sit back and enjoy the cows! "
sleep 1

cowsay "Performing upgrades"

echo " + apt-get update"
apt-get update
echo " + apt-get upgrade"
apt-get upgrade -y

cowsay "Preparing MongoDB"

echo " + apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10"
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
echo " + echo \"deb http://repo.mongodb.org/apt/ubuntu \"$(lsb_release -sc)\"/mongodb-org/3.0 multiverse\" | tee /etc/apt/sources.list.d/mongodb-org-3.0.list"
echo "deb http://repo.mongodb.org/apt/ubuntu "$(lsb_release -sc)"/mongodb-org/3.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-3.0.list

cowsay "Preparing Node.js"

echo " + curl -sL https://deb.nodesource.com/setup_0.12 | bash -"
curl -sL https://deb.nodesource.com/setup_0.12 | bash -

cowsay "Installing packages"

echo " + apt-get install -y mongodb-org build-essential nodejs"
apt-get install -y mongodb-org build-essential nodejs

cowsay "Configuring mongodb"

echo " + cat /vagrant/provision.mongo | mongo"
cat /vagrant/provision.mongo | mongo
echo " + sed -i \"s/#auth/auth/\" /etc/mongod.conf"
sed -i "s/#auth/auth/" /etc/mongod.conf

cowsay "Configuring app service"

echo " + cp /vagrant/app.upstart /etc/init/app.conf"
cp /vagrant/app.upstart /etc/init/app.conf
echo " + useradd app"
useradd app

cowsay "Running npm install"

echo " + cd /vagrant"
cd /vagrant
echo " + npm install"
npm install

cowsay "Restarting services"

echo " + service mongod restart"
service mongod restart
echo " + service app restart"
service app restart

cowsay "Your setup is ready! "
sleep 1
cowsay "A virtual machine is running in the background. To kill it, come back to this folder and run \`vagrant halt\`. " 
sleep 2
cowsay "To start this virtual machine again, rerun \`vagrant up\`. It shouldn't take long. "
sleep 2
echo "Copy this: vagrant ssh -c 'sudo service app restart'"
cowsay "To restart the app without rebooting, run \`vagrant ssh -c 'sudo service app restart'\`"
sleep 2
cowsay "Happy hacking! "
