class JenkinsJobs {
    constructor({ id, pipelineId, jobName, jobUrl, lastBuildNumber }) {
        this.id = id;
        this.pipelineId = pipelineId;
        this.jobName = jobName;
        this.jobUrl = jobUrl;
        this.lastBuildNumber = lastBuildNumber;
    }
}