/// <reference path="../typings/main.d.ts" />
import fs = require('fs');
import exec = require('child_process');

export class VersionUpdater{

    getNewVersion(data){
        var module = data.module;
        var dependencies = module.dependencies;
        var repoPath: string = module.fsLocation;

        var gitStateChecker = new StateChecker();
        var isDepricated : boolean = gitStateChecker.isDeprecated(repoPath);
        var hasUpdatedDependencies : boolean = false;

        var packageJson : any = JSON.parse(<string><any>fs.readFileSync(repoPath + '/package.json'));

        if (dependencies) {
            for (var i = 0; i < dependencies.length; i++) {
                if (!data.packages[dependencies[i].name]) {
                    data.module = dependencies[i];
                    this.getNewVersion(data);
                    hasUpdatedDependencies = dependencies[i].isDepricated;
                }
            }
        }

        if (hasUpdatedDependencies || isDepricated) {
            module.isDepricated = isDepricated;
            module.newVersion = this.incVersion(packageJson.version);
        }

        if (!data.packages[module.name]){
            data.packages[module.name] = module;
        }

        return data;
    }

    updateVersion(data){

        var module = data.module;
        if (module.isDepricated) {
            var repoPath:string = module.fsLocation;
            var packageJson:any = JSON.parse(<string><any>fs.readFileSync(repoPath + '/package.json'));

            packageJson.version = module.newVersion;
            var dependencyKeys = Object.keys(packageJson.dependencies);
            for (var i = 0; i < dependencyKeys.length; i++){
                var packageItem = data.packages[dependencyKeys[i]];
                if (packageItem) {
                    var prefix : string = "";
                    if (packageJson.dependencies[dependencyKeys[i]].startsWith("^")){
                        prefix = "^";
                    }
                    packageJson.dependencies[dependencyKeys[i]] = prefix + packageItem.newVersion;
                }
            }

            fs.writeFileSync(repoPath + '/package.json', JSON.stringify(packageJson, null, 4));
        }
        return data;
    }

    incVersion(version : string) : string{
        var incVersion : string;
        var sparator : string = ".";
        var lastPart : number = parseInt(version.substr(version.lastIndexOf(sparator) + sparator.length));
        lastPart = lastPart+1;
        incVersion = version.substring(0, version.lastIndexOf(sparator) + sparator.length) + lastPart;
        return incVersion;
    }
}

export class StateChecker{
    executeCommand(command : string) : string{
        var commandResult : string = <string><any>exec.execSync(command,
            (error, stdout, stderr) => {
                if (stderr !== null){
                    console.log(`stderr: ${stderr}`);
                }
                if (error !== null) {
                    console.log(`exec error: ${error}`);
                }
            }).toString();
        return commandResult;
    }

    getLastTag(repoPath) : string{
        var tag : string = this.executeCommand("cd " + repoPath + " && git tag");
        var tags : string [] = tag.split(new RegExp("\n", "g"));
        return tags[tags.length-2];
    }

    getTagCommit(repoPath, tagName) : string{
        var commit : string ="";
        if(repoPath && tagName) {
            var commitInfo: string = this.executeCommand("cd " + repoPath + " && git show " + tagName);
            var commitInfoLines : string[] = commitInfo.split(/\n/g);
            for (var i = 0; i < commitInfoLines.length; i++) {
                if (commitInfoLines[i].match(/^commit \w+/)) {
                    commit = commitInfoLines[i].substring(7);
                    break;
                }
            }
        }
        return commit;
    }

    getLastRepoCommit(repoPath) : string{
        var repoCommits : string = this.executeCommand("cd " + repoPath + " && git log -1");
        var repoCommitsLines : string[] = repoCommits.split(/\n/g);
        var lastCommit : string;
        for (var i = 0; i < repoCommitsLines.length; i++){
            if (repoCommitsLines[i].match(/^commit \w+/)){
                lastCommit = repoCommitsLines[i].substring(7);
                break;
            }
        }

        return lastCommit;
    }

    public isDeprecated(repoPath : string) : boolean{
        var lastTag : string = this.getLastTag(repoPath);
        var lastTagCommit : string = this.getTagCommit(repoPath, lastTag);
        var lastRepoCommit : string = this.getLastRepoCommit(repoPath);
        var compareResult : number = lastRepoCommit.localeCompare(lastTagCommit);
        if (compareResult == 0)
            return false;
        else
            return true;
    }
}