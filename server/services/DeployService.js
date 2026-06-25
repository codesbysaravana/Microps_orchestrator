const { ECSClient, RegisterTaskDefinitionCommand, UpdateServiceCommand } = require("@aws-sdk/client-ecs");

require('dotenv').config();

const ecsClient = new ECSClient({ region: process.env.AWS_REGION });

const AWS_CLUSTER_NAME_HQ = process.env.AWS_CLUSTER_NAME_HQ

const deployService = (userId, projectName, imageURI) => {
    const familyName = `tenant-${userId}-${projectName}-task`
    const serviceName = `tenant-${userId}-${projectName}-service`
}

