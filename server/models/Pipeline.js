class Pipeline {
    constructor({ id, projectId, buildCommand, outputDirectory, status }) {
        this.id = id;
        this.projectId = projectId;
        this.buildCommand = buildCommand;
        this.outputDirectory = outputDirectory;
        this.status = status;
    }
}

