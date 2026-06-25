const fs = require("fs/promises");
const path = require("path");

const { getCrumb } = require('../utils/getJenkinsCrumb');
const { projectsDB } = require('../db/pg');
const { buildImage } = require('../services/DeployService');

require('dotenv').config();

const JENKINS_URL = process.env.JENKINS_URL;

//centeral job state
const stateJob = {
  job: ""
}

const jenkinsInit = async (userId, repoUrl, branch, buildCommand, projectName) => {
    console.log('Logged start Build');
    const response = JSON.stringify({repoUrl, branch, buildCommand, projectName});
    
    const language = 'javascript';
    const framework = 'nodejs';
    const installCommand = 'npm build';
    const dbresponse = await projectsDB(userId, repoUrl, branch, language, framework, installCommand, buildCommand, projectName);
    console.log(dbresponse);
    
    const XML =  generateXMLForJenkins(repoUrl, branch, buildCommand); //this returns a string to save
    console.log("REPO-URL:",repoUrl);
    console.log("BRANCH:", branch);
    console.log("BUILD:", buildCommand);
/*     const filePathSaveXML = path.join( //this NEEDED MAN NEEEEEEEDEDDD
        __dirname, 
        "../configs/project-1.xml"
    ); 
    await fs.writeFile(filePathSaveXML, XML);  */

    const {crumb, cookie} = await getCrumb();
    //before this need the crumb
    await jenkinsConnect(projectName, XML, crumb, cookie);

    /* const filePath = path.join(
        __dirname, 
        "../repository/Database.json"
    );
    await fs.writeFile(filePath, response); */
   
    return response;
}

module.exports = { jenkinsInit  };



function generateXMLForJenkins(repoUrl, branch, buildCommand) { //added new for BUILDAH
    // We define the image name based on your project name
    // Using Buildah variables like ${BUILD_NUMBER} which Jenkins populates automatically during a run
    return `<?xml version='1.1' encoding='UTF-8'?>
<project>
  <description>MicroOps Automated Buildah Engine</description>
  <keepDependencies>false</keepDependencies>
  <properties/>
  
  <scm class="hudson.plugins.git.GitSCM" plugin="git@5.7.0">
    <configVersion>2</configVersion>
    <userRemoteConfigs>
      <hudson.plugins.git.UserRemoteConfig>
        <url>${repoUrl}</url>
      </hudson.plugins.git.UserRemoteConfig>
    </userRemoteConfigs>
    <branches>
      <hudson.plugins.git.BranchSpec>
        <name>*/${branch}</name>
      </hudson.plugins.git.BranchSpec>
    </branches>
    <doGenerateSubmoduleConfigurations>false</doGenerateSubmoduleConfigurations>
    <submoduleCfg class="empty-list"/>
    <extensions/>
  </scm>
  
  <canRoam>true</canRoam>
  <disabled>false</disabled>
  <blockBuildWhenDownstreamBuilding>false</blockBuildWhenDownstreamBuilding>
  <blockBuildWhenUpstreamBuilding>false</blockBuildWhenUpstreamBuilding>
  <triggers/>
  <concurrentBuild>false</concurrentBuild>
  
  <builders>
    <hudson.tasks.Shell>
      <command>
# 1. Run any custom pre-build compilation commands sent by the user (like npm run build)
${buildCommand}

# 2. Inform the logs that Buildah is starting
echo "====== MicrOps Core: Launching Rootless Buildah Build ======"

# 3. Build the OCI/Docker image using Buildah in unprivileged user-space
# This looks for the Dockerfile in the cloned repository root
buildah bud --isolation=chroot -t microps-local-registry:latest .

echo "====== MicrOps Core: Image Built Successfully ======"

# 4. Optional: If you want to push to Docker Hub free tier immediately from here
# buildah login -u YOUR_REGISTRY_USER -p YOUR_REGISTRY_PASSWORD registry.hub.docker.com
# buildah push microps-local-registry:latest docker://registry.hub.docker.com/YOUR_REGISTRY_USER/user-app:\${BUILD_NUMBER}

      </command>
    </hudson.tasks.Shell>
  </builders>
  
  <publishers/>
  <buildWrappers/>
</project>`;
}//new adds cookies and crumbs


const jenkinsConnect = async (projectName, XML, crumb, cookie) => { //jenkins fully all XML no JSON
/*     console.log("COOKIE:");
    console.log(cookie);
    console.log("CRUMB:");
    console.log(crumb);
    console.log(projectName);
 */
    const auth = Buffer .from(`admin:${process.env.JENKINS_KEY}`).toString('base64'); ///for no 401

    console.log(process.env.JENKINS_KEY);
    const jobName = `${projectName}-${Date.now()}`;
    try {
        //const auth = `admin: ${process.env.JENKINS_KEY}`;
        const connect = await fetch(`${JENKINS_URL}/createItem?name=${jobName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/xml', 
                'Authorization': `Basic ${auth}`, //for jenkins
                [crumb.crumbRequestField]: crumb.crumb,   //these are obj from jenkins so . and .
                'Cookie': cookie
            }, //jenkins expects xml
            body: XML
        });
        console.log(connect.status);
        console.log(connect.statusText);
        const response = await connect.text(); //const response = connect.json(); this is a unreseolved PROMISE
        //console.log(response);
  
        stateJob.job = jobName; 
        console.log(stateJob.job);

        jenkinsBuild(jobName, auth, cookie, crumb);
    } catch (err) {
        console.log(err);
        console.log('errorOccured');
    }
} // .text() often returns random so all to text

//make note to send 403 a valid crumb to jenkins
// a crumb is csrf checks if this source is trusted //if no crumb then 403
//a crumb is basically jenkins auth service, we need to ask it and provide it back 
// without a crumb then its a authorization failure like im authenticated but i aint allowed to suse it

async function jenkinsBuild (jobName, auth, cookie, crumb) {
  const res = await fetch(`${JENKINS_URL}/job/${jobName}/build`, {
    method: "POST",
    headers: {
      'Authorization': `Basic ${auth}`,
      [crumb.crumbRequestField]: crumb.crumb,
      'Cookie': cookie
    }
  });

  //console.log(res.status);
  const itemId = res.headers.get("location");
  console.log(itemId);
  await getJenkinsJobStatus(itemId, auth, crumb, cookie);
}


async function getJenkinsJobStatus(itemIdURL, auth, crumb, cookie) {
  const res = await fetch(`${itemIdURL}api/json`, {
    method: "GET",
    headers: {
      "Authorization": `Basic ${auth}`,
      [crumb.crumbRequestField]: crumb.crumb,
      'Cookie': cookie
    }
  });

  const responsefull = await res.text();
  console.log(responsefull);
  console.log('-----------------------------------------------------------------------------------------------------------------------');
  const buildNumber = await pollQueue(itemIdURL, auth, crumb, cookie)
  if(buildNumber) {
    const buildRes = await pollBuild(buildNumber.url, auth, crumb, cookie); //see line 206 & 197 to understand
  
    //DOCKER PART
    await buildImage(stateJob.job);
  
  } else {
    console.log("Error or possible build start failure")
  }
}

//in headers cant do headers.() somehting as a object
// in headers get as headers.get(location);

async function pollQueue(queueUrl, auth, crumb, cookie) {
    while (true) {
        const res = await fetch(
            `${queueUrl}api/json`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json', //you said i was no longer authentiacted, so i got html, waht if i was?
                'Authorization': `Basic ${auth}`,
                [crumb.crumbRequestField]: crumb.crumb,
                'Cookie': cookie
              }
            }
        );
        const data = await res.json();
        //console.log(data); //in this the id is the build number

        if (data.executable) {
            console.log(data);
            return data.executable; //see line 206 to understand 
        }
        await new Promise(
            resolve => setTimeout(resolve, 1000)
        );
    }
}

//how does polling stop -> queueItem becomes leftItem WHAT?
/* "executable": {
  "number": 1,
  "url": "http://localhost:8080/job/microps-core-1781602368259/1/" //thats the build id app sends back {buildUrl}
} */


//now repeatedly poll for the build status
async function pollBuild(buildUrl, auth, crumb, cookie) {
  while (true) {
    const res = await fetch(`${buildUrl}api/json`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${auth}`,
        [crumb.crumbRequestField]: crumb.crumb,
        "Cookie": cookie
      }
    });

    const build = await res.json();

    console.log(
      `Build #${build.number} | Building: ${build.building} | Result: ${build.result}`
    );

    if (!build.building) { //when building stops means build ended so
      return {
        buildNumber: build.number,
        result: build.result,
        duration: build.duration,
        url: build.url
      };
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}