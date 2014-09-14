/*
 * Copyright (C) 2010 JFrog Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

BS.artifactory = {
    populateRepoSelect: function (response, options, repoSelector, existingValue, addEmpty) {

        var xmlDoc = response.responseXML;
        repoSelector.innerHTML = '';

        var foundDefault = false;
        if (xmlDoc) {

            if (addEmpty) {
                var emptyOption = document.createElement('option');
                emptyOption.innerHTML = '-- To use Artifactory for resolution select a virtual repository --';
                emptyOption.value = null;
                repoSelector.appendChild(emptyOption);
                if (!existingValue || (existingValue.length == 0)) {
                    repoSelector.selectedIndex = 0;
                    foundDefault = true;
                }
            }

            var repos = xmlDoc.getElementsByTagName('repoName');
            for (var i = 0, l = repos.length; i < l; i++) {
                var repo = repos[i];
                var repoName = repo.textContent || repo.text || '';
                var option = document.createElement('option');
                option.innerHTML = repoName;
                option.value = repoName;
                repoSelector.appendChild(option);
                if (!foundDefault && (repoName == existingValue)) {
                    repoSelector.selectedIndex = (addEmpty) ? (i + 1) : i;
                    foundDefault = true;
                }
            }
            BS.MultilineProperties.updateVisible();
        }
    },

    checkArtifactoryHasAddons: function (selectedUrlId) {
        var publicKey = jQuery('[name="publicKey"]').val();
        var pass = $('secure:org.jfrog.artifactory.selectedDeployableServer.deployerPassword').value;
        var encyptedPass;
        if ($('prop:encrypted:secure:org.jfrog.artifactory.selectedDeployableServer.deployerPassword').value != '') {
            encyptedPass = $('prop:encrypted:secure:org.jfrog.artifactory.selectedDeployableServer.deployerPassword').value;
        } else {
            encyptedPass = BS.Encrypt.encryptData(pass, publicKey);
        }
        var buildDependencies = $('org.jfrog.artifactory.selectedDeployableServer.buildDependencies');
        if (buildDependencies) {
            BS.ajaxRequest(base_uri + '${controllerUrl}', {
                parameters: 'selectedUrlId=' + selectedUrlId + '&onServerChange=true&checkArtifactoryHasAddons=true'
                    + '&overrideDeployerCredentials=' + BS.artifactory.isOverrideDefaultDeployerCredentialsSelected()
                    + '&username=' + $('org.jfrog.artifactory.selectedDeployableServer.deployerUsername').value
                    + '&password=' + encyptedPass,
                onComplete: function (response, options) {

                    var xmlDoc = response.responseXML;
                    if (xmlDoc) {
                        BS.artifactory.applyDisabledMessage(buildDependencies, xmlDoc);
                        BS.MultilineProperties.updateVisible();
                    }
                }
            });
        }
    },

    applyDisabledMessage: function (textAreaField, xmlDoc) {
        var hasAddons = xmlDoc.getElementsByTagName('hasAddons')[0];
        var hasAddonsValue = hasAddons.textContent || hasAddons.text || '';
        if (hasAddonsValue == "true") {
            if (textAreaField.value == '${disabledMessage}') {
                textAreaField.value = '';
            }
            textAreaField.disabled = false;
        }
        else {
            textAreaField.value = '${disabledMessage}';
            textAreaField.disabled = true;
        }
    },

    checkCompatibleVersion: function (selectedUrlId) {
        var publicKey = jQuery('[name="publicKey"]').val();
        var pass = $('secure:org.jfrog.artifactory.selectedDeployableServer.deployerPassword').value;
        var encyptedPass;
        if ($('prop:encrypted:secure:org.jfrog.artifactory.selectedDeployableServer.deployerPassword').value != '') {
            encyptedPass = $('prop:encrypted:secure:org.jfrog.artifactory.selectedDeployableServer.deployerPassword').value;
        } else {
            encyptedPass = BS.Encrypt.encryptData(pass, publicKey);
        }
        BS.ajaxRequest(base_uri + '${controllerUrl}', {
            parameters: 'selectedUrlId=' + selectedUrlId + '&onServerChange=true&checkCompatibleVersion=true'
                + '&overrideDeployerCredentials=' + BS.artifactory.isOverrideDefaultDeployerCredentialsSelected()
                + '&username=' + $('org.jfrog.artifactory.selectedDeployableServer.deployerUsername').value
                + '&password=' + encyptedPass,
            onComplete: function (response, options) {

                var xmlDoc = response.responseXML;
                if (xmlDoc) {
                    var compatibleVersion = xmlDoc.getElementsByTagName('compatibleVersion')[0];
                    var compatibleVersionValue = compatibleVersion.textContent || compatibleVersion.text || '';
                    if (compatibleVersionValue == "true") {
                        BS.Util.hide($('version.warning.container'));
                        BS.Util.hide($('offline.warning.container'));
                        $('urlSelectTD').style.borderBottom = '1px dotted #CCCCCC';
                        $('urlSelectTH').style.borderBottom = '1px dotted #CCCCCC';
                    }
                    else {
                        if (compatibleVersionValue == "unknown") {
                            BS.Util.hide($('version.warning.container'));
                            BS.Util.show($('offline.warning.container'));
                            $('urlSelectTD').style.borderBottom = 'none';
                            $('urlSelectTH').style.borderBottom = 'none';
                        }
                        else {
                            BS.Util.show($('version.warning.container'));
                            BS.Util.hide($('offline.warning.container'));
                            $('urlSelectTD').style.borderBottom = 'none';
                            $('urlSelectTH').style.borderBottom = 'none';
                        }
                    }
                    BS.MultilineProperties.updateVisible();
                }
            }
        });
    },

    toggleLicenseViolationRecipientsVisibility: function () {
        var shouldRunLicenseChecks = $('org.jfrog.artifactory.selectedDeployableServer.runLicenseChecks').checked;
        if (shouldRunLicenseChecks) {
            BS.Util.show($('licenseViolationRecipients.container'));
            BS.Util.show($('limitChecksToScopes.container'));
            BS.Util.show($('includePublishedArtifacts.container'));
            BS.Util.show($('disableAutoLicenseDiscovery.container'));
        }
        else {
            BS.Util.hide($('licenseViolationRecipients.container'));
            $('org.jfrog.artifactory.selectedDeployableServer.licenseViolationRecipients').value = '';
            BS.Util.hide($('limitChecksToScopes.container'));
            $('org.jfrog.artifactory.selectedDeployableServer.limitChecksToScopes').value = '';
            BS.Util.hide($('includePublishedArtifacts.container'));
            $('org.jfrog.artifactory.selectedDeployableServer.includePublishedArtifacts').checked = false;
            BS.Util.hide($('disableAutoLicenseDiscovery.container'));
            $('org.jfrog.artifactory.selectedDeployableServer.disableAutoLicenseDiscovery').checked = false;
        }
        BS.MultilineProperties.updateVisible();
    },

    toggleBlackDuckVisibility: function () {
        var shouldRunChecks = $('org.jfrog.artifactory.selectedDeployableServer.blackduck.runChecks').checked;
        if (shouldRunChecks) {
            BS.Util.show($('blackduck.appName.container'));
            BS.Util.show($('blackduck.appVersion.container'));
            BS.Util.show($('blackduck.reportRecipients.container'));
            BS.Util.show($('blackduck.scopes.container'));
            BS.Util.show($('blackduck.includePublishedArtifacts.container'));
            BS.Util.show($('blackduck.autoCreateMissingComponentRequests.container'));
            BS.Util.show($('blackduck.autoDiscardStaleComponentRequests.container'));
        }
        else {
            BS.Util.hide($('blackduck.appName.container'));
            $('org.jfrog.artifactory.selectedDeployableServer.blackduck.appName').value = '';
            BS.Util.hide($('blackduck.appVersion.container'));
            $('org.jfrog.artifactory.selectedDeployableServer.blackduck.appVersion').value = '';
            BS.Util.hide($('blackduck.reportRecipients.container'));
            $('org.jfrog.artifactory.selectedDeployableServer.blackduck.reportRecipients').value = '';
            BS.Util.hide($('blackduck.scopes.container'));
            $('org.jfrog.artifactory.selectedDeployableServer.blackduck.scopes').value = '';
            BS.Util.hide($('blackduck.includePublishedArtifacts.container'));
            $('org.jfrog.artifactory.selectedDeployableServer.blackduck.includePublishedArtifacts').checked = false;
            BS.Util.hide($('blackduck.autoCreateMissingComponentRequests.container'));
            $('org.jfrog.artifactory.selectedDeployableServer.blackduck.autoCreateMissingComponentRequests').checked = true;
            BS.Util.hide($('blackduck.autoDiscardStaleComponentRequests.container'));
            $('org.jfrog.artifactory.selectedDeployableServer.blackduck.autoDiscardStaleComponentRequests').checked = true;
        }
        BS.MultilineProperties.updateVisible();
    },

    toggleIncludeEnvVarsVisibility: function () {
        var shouldIncludeEnvVars = $('org.jfrog.artifactory.selectedDeployableServer.includeEnvVars').checked;
        if (shouldIncludeEnvVars) {
            BS.Util.show($('envVarsIncludePatterns.container'));
            BS.Util.show($('envVarsExcludePatterns.container'));
        }
        else {
            BS.Util.hide($('envVarsIncludePatterns.container'));
            BS.Util.hide($('envVarsExcludePatterns.container'));
        }
        BS.MultilineProperties.updateVisible();
    },

    isDeployArtifactsSelected: function () {
        return $('org.jfrog.artifactory.selectedDeployableServer.deployArtifacts').checked;
    },

    isPublishBuildInfoSelected: function () {
        return $('org.jfrog.artifactory.selectedDeployableServer.publishBuildInfo').checked;
    },

    toggleDeployArtifactsSelection: function () {
        if (BS.artifactory.isDeployArtifactsSelected()) {
            BS.Util.show($('deployDefaultBranchOnly.container'));
            BS.Util.show($('deployIncludePatterns.container'));
            BS.Util.show($('deployExcludePatterns.container'));
        }
        else {
            BS.Util.hide($('deployDefaultBranchOnly.container'));
            $('org.jfrog.artifactory.selectedDeployableServer.deployDefaultBranchOnly').checked = true;
            BS.Util.hide($('deployIncludePatterns.container'));
            $('org.jfrog.artifactory.selectedDeployableServer.deployIncludePatterns').value = '';
            BS.Util.hide($('deployExcludePatterns.container'));
            $('org.jfrog.artifactory.selectedDeployableServer.deployExcludePatterns').value = '';
        }
        BS.MultilineProperties.updateVisible();
    },

    isOverrideDefaultDeployerCredentialsSelected: function () {
        return $('org.jfrog.artifactory.selectedDeployableServer.overrideDefaultDeployerCredentials').checked;
    },

    toggleOverrideDefaultDeployerSelection: function () {
        if (BS.artifactory.isOverrideDefaultDeployerCredentialsSelected()) {
            BS.Util.show($('deployerUsername.container'));
            BS.Util.show($('deployerPassword.container'));
        }
        else {
            BS.Util.hide($('deployerUsername.container'));
            $('org.jfrog.artifactory.selectedDeployableServer.deployerUsername').value = '';
            BS.Util.hide($('deployerPassword.container'));
            $('secure:org.jfrog.artifactory.selectedDeployableServer.deployerPassword').value = '';
        }
        BS.MultilineProperties.updateVisible();
    },

    toggleReleaseManagementFieldsVisibility: function (builderName) {
        var releaseManagementEnabled = $('org.jfrog.artifactory.selectedDeployableServer.enableReleaseManagement').checked;
        if (releaseManagementEnabled) {
            BS.Util.show($('vcsTagsBaseUrlOrName.container'));
            BS.Util.show($('gitReleaseBranchNamePrefix.container'));
            $('org.jfrog.artifactory.selectedDeployableServer.gitReleaseBranchNamePrefix').value = 'REL-BRANCH-';
            if (builderName == 'maven') {
                BS.Util.show($('alternativeMavenGoals.container'));
                BS.Util.show($('alternativeMavenOptions.container'));
                BS.Util.show($('defaultModuleVersionConfiguration.container'));
            } else if (builderName == 'gradle') {
                BS.Util.show($('releaseProperties.container'));
                BS.Util.show($('nextIntegrationProperties.container'));
                BS.Util.show($('alternativeGradleTasks.container'));
                BS.Util.show($('alternativeGradleOptions.container'));
            }
        }
        else {
            BS.Util.hide($('vcsTagsBaseUrlOrName.container'));
            $('org.jfrog.artifactory.selectedDeployableServer.vcsTagsBaseUrlOrName').value = '';
            BS.Util.hide($('gitReleaseBranchNamePrefix.container'));
            $('org.jfrog.artifactory.selectedDeployableServer.gitReleaseBranchNamePrefix').value = '';
            BS.Util.hide($('alternativeMavenGoals.container'));
            $('org.jfrog.artifactory.selectedDeployableServer.alternativeMavenGoals').value = '';
            BS.Util.hide($('alternativeMavenOptions.container'));
            $('org.jfrog.artifactory.selectedDeployableServer.alternativeMavenOptions').value = '';
            BS.Util.hide($('defaultModuleVersionConfiguration.container'));
            BS.Util.hide($('releaseProperties.container'));
            $('org.jfrog.artifactory.selectedDeployableServer.releaseProperties').value = '';
            BS.Util.hide($('nextIntegrationProperties.container'));
            $('org.jfrog.artifactory.selectedDeployableServer.nextIntegrationProperties').value = '';
            BS.Util.hide($('alternativeGradleTasks.container'));
            $('org.jfrog.artifactory.selectedDeployableServer.alternativeGradleTasks').value = '';
            BS.Util.hide($('alternativeGradleOptions.container'));
            $('org.jfrog.artifactory.selectedDeployableServer.alternativeGradleOptions').value = '';
        }
        BS.MultilineProperties.updateVisible();
    }
};