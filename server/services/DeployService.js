const { ECSClient, RegisterTaskDefinitionCommand, UpdateServiceCommand, CreateServiceCommand, DescribeServicesCommand } = require("@aws-sdk/client-ecs");
const { ElasticLoadBalancingV2Client,
    CreateTargetGroupCommand,
    CreateRuleCommand,
    DescribeRulesCommand
} = require("@aws-sdk/client-elastic-load-balancing-v2");

require('dotenv').config();

const { buildBus } = require('../utils/eventBus');

//create clients constructors
const ecsClient = new ECSClient({ region: process.env.AWS_REGION });
const elbClient = new ElasticLoadBalancingV2Client({ region: process.env.AWS_REGION });

//ECS-CLUSTER
const AWS_CLUSTER_NAME_HQ = process.env.AWS_CLUSTER_NAME_HQ
//ALB 
const VPC_ID = process.env.VPC_ID;
const LISTENER_ALB_ARN = process.env.ALB_ARN;
const BASE_DOMAIN = process.env.BASE_DOMAIN || "microps.com" //base my domain



//NETWORK ALLOTMENT VPC AND SUBNETS STAGE --> DOMAIN
//Helper --> Finds the next available Priority number for ALB Rules
async function getNextRulePriority() { //gives high priority
    const response = await elbClient.send(new DescribeRulesCommand({ ListenerArn: LISTENER_ALB_ARN })); //gives priorities as number strings
    const priorities = response.Rules.map(r => r.Priority).filter(p => p != 'default').map(Number);
    //picks only "1"                    //filter not default        //converts string to number
    return priorities.length > 0 ? Math.max(...priorities) + 1 : 1;                                     //spread operator spreads it as 1,2,3 and without array[]
} //returns the next highest priority if 3? return 4 or if nothing then 1 priority


// DEPLOY STAGE FOR ECS 
const deployServiceECS = async (userId, projectName, imageURI) => {
    // 32-character limit for Target Group names in AWS
    const shortProject = projectName.substring(0, 10);
    const targetGroupName = `tg-u${userId}-${shortProject}-${Date.now().toString().slice(-6)}`;

    const familyName = `tenant-${userId}-${projectName}-task`;
    const serviceName = `tenant-${userId}-${projectName}-service`;
    const tenantDomain = `tenant-${userId}-${projectName}.${BASE_DOMAIN}`;

    try {
        console.log(`Step:1 ---> Started The Deployment to ECS Fargate with project: ${projectName}`);
        console.log(`Using Image ECR as ${imageURI}`);

        buildBus.emit('build-progress', {
            userId: userId,
            message: 'ECR pushed and ECS DEPLOYMENT STARTED'
        })

        const registerResponse = await ecsClient.send(
            new RegisterTaskDefinitionCommand({
                family: familyName,
                networkMode: "awsvpc",
                requiresCompatibilities: ["FARGATE"],
                cpu: "256", //0.25 cpu
                memory: "512", //MB
                runtimePlatform: {
                    operatingSystemFamily: "LINUX",
                    cpuArchitecture: "X86_64"
                },
                executionRoleArn: process.env.ECS_EXECUTION_ROLE_ARN,
                taskRoleArn: process.env.ECS_TASK_ROLE_ARN,
                containerDefinitions: [
                    {
                        name: projectName,
                        image: imageURI,
                        essential: true,
                        portMappings: [
                            {
                                containerPort: 3000,
                                protocol: "tcp"
                            }
                        ],
                        logConfiguration: {
                            logDriver: "awslogs",
                            options: {
                                "awslogs-group": "/ecs/microps-tenants",
                                "awslogs-region": process.env.AWS_REGION,
                                "awslogs-stream-prefix": `tenant-${userId}`,
                                "awslogs-create-group": "true"
                            }
                        }
                    }
                ]
            })
        );

        console.log(registerResponse);
        const newTaskArn = registerResponse.taskDefinition.taskDefinitionArn;
        console.log(`Task Definition: ${newTaskArn}`);

        // Check if the service already exists
        const describe = await ecsClient.send(
            new DescribeServicesCommand({
                cluster: AWS_CLUSTER_NAME_HQ,
                services: [serviceName]
            })
        );

        const serviceExists =
            describe.services &&
            describe.services.length > 0 &&
            describe.services[0].status !== "INACTIVE";

        if (!serviceExists) {
            console.log(`Service ${serviceName} does not exist. Creating...`);

            // 3A. CREATING TARGET GROUP
            const tgResponse = await elbClient.send(new CreateTargetGroupCommand({
                Name: targetGroupName,
                Protocol: "HTTP",
                Port: 3000,
                VpcId: VPC_ID,
                TargetType: "ip",
                HealthCheckPath: "/",
                HealthCheckIntervalSeconds: 30
            }));
            const targetGroupArn = tgResponse.TargetGroups[0].TargetGroupArn;
            console.log(targetGroupArn);

            // 3B. Create The ALB Listener Rule, (Routes Based on subdomain)
            const rulePriority = await getNextRulePriority();
            await elbClient.send(new CreateRuleCommand({
                ListenerArn: LISTENER_ALB_ARN,
                Priority: rulePriority,
                Conditions: [{
                    Field: "host-header",
                    HostHeaderConfig: { Values: [tenantDomain] }
                }],
                Actions: [{
                    Type: "forward",
                    TargetGroupArn: targetGroupArn
                }]
            }))

            console.log(`[CD Engine] ✅ Network routing configured for ${tenantDomain}`);
            console.log(`[CD Engine] Provisioning Fargate Service...`);

            await ecsClient.send(
                new CreateServiceCommand({
                    cluster: AWS_CLUSTER_NAME_HQ,
                    serviceName,
                    taskDefinition: newTaskArn,
                    desiredCount: 1,
                    launchType: "FARGATE",

                    networkConfiguration: {
                        awsvpcConfiguration: {
                            subnets: [
                                process.env.ECS_SUBNET_1,
                                process.env.ECS_SUBNET_2
                            ],
                            securityGroups: [
                                process.env.ECS_SECURITY_GROUP
                            ],
                            assignPublicIp: "ENABLED"
                        }
                    },
                    loadBalancers: [
                        {
                            targetGroupArn: targetGroupArn,
                            containerName: projectName,
                            containerPort: 3000
                        }
                    ]
                })
            );

            console.log("Service created successfully.");
            console.log(`[CD Engine] 🚀 Deployed successfully! App will be live at http://${tenantDomain}`);
        } else {
            console.log(`Service ${serviceName} exists. Updating...`);

            await ecsClient.send(
                new UpdateServiceCommand({
                    cluster: AWS_CLUSTER_NAME_HQ,
                    service: serviceName,
                    taskDefinition: newTaskArn,
                    forceNewDeployment: true
                })
            );

            console.log("Service updated successfully.");
        }

        return true;

    } catch (err) {
        console.log("ERROR: FAILED");
        console.log(err);
    }

}


module.exports = { deployServiceECS };

