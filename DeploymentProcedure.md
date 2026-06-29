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
create a /home/ubuntu/.env on the EC2 server and paste your production database URLs, AWS keys, and GITHUB_PAT.