class Project {
    constructor({
        id, name, userId, repoUrl, branch, buildCommand
    }) {
        this.id = id;
        this.name = name;
        this.userId = userId;
        this.repoUrl = repoUrl;
        this.branch = branch;
        this.buildCommand = buildCommand;
    }
}