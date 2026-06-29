did by yours truly

1. create a EC2 server (preferrably t3.small for uk student)
2. Launch EC2 save the pem key
3. Configure Security Group: Open inbound ports:
22 (SSH for GitHub Actions deployer)
80 & 443 (HTTP/HTTPS for microps.in)
5000 (Backend API port)

4. Install Docker & Redis on EC2: SSH into my EC2 terminal and run:
bash
sudo apt update && sudo apt install -y docker.io redis-server
sudo systemctl enable docker redis-server
sudo systemctl start docker redis-server

5. Create my Production Environment File: Create /home/ubuntu/.env on the EC2 server and paste my production database URLs, AWS keys, and GITHUB_PAT.

problem with EC2 (no ssh 22 port conifured in security groups)
so securing it properly

steps
1. so i ssh'd into ec2 ran the commnads
2. but my ubuntu user didnt have docker permission so i needed to enable docker permission by creating a docker group and adding my user to that group 

adding the secrets to repository EC2 host and usernmae and pem key


MUST MUST MUST MUST MUST MUST MUST MUST MUST MUST MUST MUST MUST MUST 
here make it as such
create a /home/ubuntu/.env on the EC2 server and paste your production database URLs, AWS keys, and GITHUB_PAT..

DEPLOYED WOOHOO
1. things to make sure
2. EC2 ip changes so channge it in the yml file each time okay?  
3. and changein frontend too



🤔 What is PM2?
PM2 (Process Manager 2) is a babysitter for Node.js apps.

If you normally type node server.js in your SSH terminal and then close your terminal window, your server instantly shuts down! Or if your backend hits an unexpected error and crashes, the server stays dead.

PM2 solves this by:

Running your server continuously in the background 24/7 (even after you log out of SSH).
Auto-restarting your app within 1 millisecond if it ever crashes.
Keeping live log buffers (pm2 logs).
🛑 But wait! You might not even need PM2!
Remember how GitHub Actions deployed your app earlier? Look at the command it ran:

bash
docker run -d --name microps-api --restart always ... microps-backend:latest
Because Docker launched your app with -d (daemon background mode) and --restart always, Docker is already acting as your PM2! It is currently running your API in the background on port 5000.

To see your live server logs right now on EC2, run:

bash
docker logs -f microps-api
💻 How to install Node.js & PM2 on EC2 anyway
If you want to install Node and PM2 so you can run Node scripts directly on Ubuntu outside of Docker, run these exact commands in your EC2 terminal:

bash
# 1. Install Node.js (v20 LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
# 2. Install PM2 globally
sudo npm install -g pm2
# 3. Start your server using PM2 (if Docker isn't running it)
cd ~/microps/server
pm2 start server.js --name "microps-server"
# 4. Freeze PM2 so your server restarts automatically if AWS reboots your EC2 machine
pm2 save
pm2 startup


problem with accessing from index.html 5500 frontend, need to put inbound rule 5000 from security groups

problems with env...seems like docker only reads it once before running aftre we need to stop it if any changes to env and run it again so


🌐 GoDaddy DNS Setup:
Log into GoDaddy $\rightarrow$ go to My Domains $\rightarrow$ click DNS / Manage DNS next to microps.in.
Add / Edit these 2 Records:
Record 1: Connect your EC2 Backend Server (A Record)
Type: A
Name: @
Value / Data: 54.66.192.244
TTL: 1 Hour (or Default)
Record 2: Connect your Tenant Apps to AWS Application Load Balancer (CNAME Wildcard)
This ensures every project deployed by your users (like tenant-1-micropsfirstventure.microps.in) routes directly to your AWS ALB!

Type: CNAME
Name: * (Type literally an asterisk symbol)
Value / Data: microps-tenant-alb-1577541156.ap-southeast-2.elb.amazonaws.com
TTL: 1 Hour




allocate elastic ip to ec2
Go to the Amazon Web Services Management Console.
Search for EC2.
In the left sidebar, under Network & Security, click Elastic IPs.
If you don't have one:
Click Allocate Elastic IP address.
Leave the defaults.
Click Allocate.
Select the newly allocated Elastic IP.
Click Actions → Associate Elastic IP address.
Configure:
Resource type: Instance
Instance: Select your EC2 instance.
Private IP: Leave the default (unless your instance has multiple private IPs).
Click Associate.


RELEASE THE IP SOON