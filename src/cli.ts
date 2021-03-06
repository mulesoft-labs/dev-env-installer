#!/usr/bin/env node

import path = require("path");
import fs = require("fs");
import devUtils = require("./devUtils")
import utils = require("./exportedUtils");
import installer = require("./devEnvInstaller")

const workspaceDescriptorFileName = "workspace.json";
const requiredCommandErrorMessage = "Command required, one of: pullall, buildall, testall, install, setdirectlinks";


function findWorkspaceRoot() {
    var cliWorkspaceArg = utils.getCliArgumentByName("--workspace");
    if (cliWorkspaceArg) {
        return cliWorkspaceArg;
    }

    var potentialPackageJsonPath = path.join(__dirname, "../../../package.json");
    if (fs.existsSync(potentialPackageJsonPath)) {
        return path.join(path.dirname(potentialPackageJsonPath), "../");
    }

    return __dirname;
}

function findWorkspaceDescriptor(workspaceRoot : string) {

    var cliDescriptorArg = utils.getCliArgumentByName("--descriptor");
    if (cliDescriptorArg) {
        return cliDescriptorArg;
    }

    var potentialDescriptorPath1 = path.join(__dirname, workspaceDescriptorFileName);
    if (fs.existsSync(potentialDescriptorPath1)) {
        return potentialDescriptorPath1;
    }

    var potentialDescriptorPath2 = path.join(workspaceRoot, workspaceDescriptorFileName);
    if (fs.existsSync(potentialDescriptorPath2)) {
        return potentialDescriptorPath2;
    }

    var potentialDescriptorPath3 = path.join(__dirname, "../../../",workspaceDescriptorFileName);
    if (fs.existsSync(potentialDescriptorPath3)) {
        return potentialDescriptorPath3;
    }

    console.log("Specify workspace descriptor JSON file argument with --descriptor key, or put the file into a current or workspace directory");
    return null;
}

if (process.argv[2]) {
    var workspaceRoot = findWorkspaceRoot();

    var workspaceDescriptor = findWorkspaceDescriptor(workspaceRoot);
    var useDirectSymlinks = utils.hasCliArgument("-directlinks");

    if (workspaceRoot && workspaceDescriptor) {
        console.log("Workspace root is: " + workspaceRoot);
        console.log("Workspace descriptor is: " + workspaceDescriptor);

        switch (process.argv[2]) {
            case("pullall"):
                devUtils.pullAll(workspaceRoot, workspaceDescriptor);
                break;
            case ("buildall"):
                devUtils.buildAll(workspaceRoot, workspaceDescriptor);
                break;
            case ("testall"):
                devUtils.testAll(workspaceRoot, workspaceDescriptor);
                break;
            case ("install"):
                installer.setUp(workspaceRoot, workspaceDescriptor,useDirectSymlinks);
                break;
            case ("setdirectlinks"):
                installer.createSymlinks(workspaceRoot, workspaceDescriptor);
                break;
            default:
                console.log(requiredCommandErrorMessage);
        }
    }
} else {
    console.log(requiredCommandErrorMessage);
}

