class Build {
    constructor({ id, pipelineId, buildNumber, status, startedAt, endedAt, logsId, jenkinsId }) {
        this.id = id;
        this.pipelineId = pipelineId;
        this.buildNumber = buildNumber;
        this.status = status;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.logsId = logsId;
        this.jenkinsId = jenkinsId;
    }
}   