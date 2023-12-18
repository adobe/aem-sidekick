/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {
  getGitHubSettings,
  getConfig,
  removeConfig,
  setConfig,
} from './utils.js';

/**
 * Returns an existing project configuration.
 * @param {Object|string} project The project settings or handle
 * @returns {Promise<Object>} The project configuration
 */
export async function getProject(project = {}) {
  let owner;
  let repo;
  if (typeof project === 'string' && project.includes('/')) {
    [owner, repo] = project.split('/');
  } else {
    ({ owner, repo } = project);
  }
  if (owner && repo) {
    const handle = `${owner}/${repo}`;
    const projectConfig = await getConfig('sync', handle);
    if (projectConfig) {
      // check session storage for auth token
      return { ...projectConfig, ...(await getConfig('session', handle) || {}) };
    }
  }
  return undefined;
}

/**
 * Returns all project configurations.
 * @returns {Promise<Object[]>} The project configurations
 */
export async function getProjects() {
  return Promise.all((await getConfig('sync', 'hlxSidekickProjects') || [])
    .map((handle) => getProject(handle)));
}

/**
 * Updates a project configuration.
 * @param {Object} project The project settings
 * @returns {Promise<Object>} The project configuration
 */
export async function updateProject(project) {
  let owner;
  let repo;
  if (typeof project === 'string' && project.includes('/')) {
    [owner, repo] = project.split('/');
  } else {
    ({ owner, repo } = project);
  }
  if (owner && repo) {
    // sanitize input
    Object.keys(project).forEach((key) => {
      if (!project[key]) {
        delete project[key];
      }
    });
    const handle = `${owner}/${repo}`;
    // put auth token to session storage
    const { authToken, authTokenExpiry } = project;
    if (authToken !== undefined) {
      delete project.authToken;
      delete project.authTokenExpiry;
      await setConfig('session', {
        [handle]: {
          owner,
          repo,
          authToken,
          authTokenExpiry,
        },
      });
    } else {
      await removeConfig('session', handle);
    }
    // update project config
    await setConfig('sync', {
      [handle]: project,
    });
    // update project index
    const projects = await getConfig('sync', 'hlxSidekickProjects') || [];
    if (!projects.includes(handle)) {
      projects.push(handle);
      await setConfig('sync', { hlxSidekickProjects: projects });
    }
    // console.log('updated project', project);
    return project;
  }
  return null;
}

/**
 * Assembles a project configuration based on a GitHub URL and/or existing settings.
 * @param {Object} obj The project settings
 * @returns {Object} The assembled project configuration
 */
export function assembleProject({
  giturl,
  owner,
  repo,
  ref = 'main',
  ...opts
}) {
  if (giturl && !owner && !repo) {
    ({ owner, repo, ref } = getGitHubSettings(giturl));
  } else {
    giturl = `https://github.com/${owner}/${repo}/tree/${ref}`;
  }
  const id = `${owner}/${repo}/${ref}`;

  return {
    id,
    giturl,
    owner,
    repo,
    ref,
    ...opts,
  };
}

/**
 * Returns the environment configuration for a given project.
 * @param {Object} config The config
 * @param {string} config.owner The owner
 * @param {string} config.repo The repository
 * @param {string} config.ref=main The ref or branch
 * @param {string} config.authToken The auth token
 * @returns {Promise<Object>} The project environment
 */
export async function getProjectEnv({
  owner,
  repo,
  ref = 'main',
  authToken,
}) {
  const env = {};
  let res;
  try {
    const options = {
      cache: 'no-store',
      credentials: 'include',
      headers: authToken ? { 'x-auth-token': authToken } : {},
    };

    res = await fetch(`https://admin.hlx.page/sidekick/${owner}/${repo}/${ref}/env.json`, options);
  } catch (e) {
    // console.log(`unable to retrieve project config: ${e}`);
  }
  if (res && res.ok) {
    const {
      preview,
      live,
      prod,
      project,
      contentSourceUrl,
    } = await res.json();
    if (preview && preview.host) {
      env.previewHost = preview.host;
    }
    if (live && live.host) {
      env.liveHost = live.host;
    }
    if (prod && prod.host) {
      env.host = prod.host;
    }
    if (project) {
      env.project = project;
    }
    if (contentSourceUrl) {
      env.mountpoints = [contentSourceUrl];
    }
  } else if (res.status === 401) {
    env.unauthorized = true;
  }
  return env;
}

/**
 * Adds a project configuration.
 * @param {Object} input The project settings
 * @returns {Promise<Object>} The added project
 */
export async function addProject(input) {
  const config = assembleProject(input);
  const { owner, repo, ref } = config;
  const env = await getProjectEnv(config);
  if (env.unauthorized && !input.authToken) {
    // defer adding project and have user sign in
    const { id: loginTabId } = await window.chrome.tabs.create({
      url: `https://admin.hlx.page/login/${owner}/${repo}/${ref}?extensionId=${window.chrome.runtime.id}`,
      active: true,
    });
    return new Promise((resolve) => {
      // retry adding project after sign in
      const retryAddProjectListener = async (message = {}) => {
        let added = false;
        if (message.authToken && owner === message.owner && repo === message.repo) {
          await window.chrome.tabs.remove(loginTabId);
          config.authToken = message.authToken;
          added = await addProject(config);
        }
        // clean up
        window.chrome.runtime.onMessageExternal.removeListener(retryAddProjectListener);
        resolve(added);
      };
      window.chrome.runtime.onMessageExternal.addListener(retryAddProjectListener);
    });
  }
  let project = await getProject(config);
  if (!project) {
    project = await updateProject({ ...config, ...env });
    // console.log('added project', config);
    // todo: alert(i18n('config_add_success'));
    return true;
  } else {
    // console.log(('project already exists', project);
    // todo: alert(i18n('config_project_exists'));
    return false;
  }
}

/**
 * Deletes a project configuration.
 * @param {Object|string} project The project settings or handle
 * @returns {Promise<Boolean>}
 */
export async function deleteProject(project) {
  let owner;
  let repo;
  let handle;
  if (typeof project === 'string' && project.includes('/')) {
    [owner, repo] = project.split('/');
    handle = project;
  } else {
    ({ owner, repo } = project);
    handle = `${owner}/${repo}`;
  }
  const projects = await getConfig('sync', 'hlxSidekickProjects') || [];
  const i = projects.indexOf(handle);
  if (i >= 0) {
    try {
      // delete admin auth header rule
      window.chrome.runtime.sendMessage({ deleteAuthToken: { owner, repo } });
      // delete the project entry
      await removeConfig('sync', handle);
      // remove project entry from index
      projects.splice(i, 1);
      await setConfig('sync', { hlxSidekickProjects: projects });
      // console.log('project deleted', handle);
      // todo: alert
      return true;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('project deletion failed', handle, e);
      // todo: alert
    }
  } else {
    // console.log('project to delete not found', handle);
    // todo: alert
  }
  return false;
}
