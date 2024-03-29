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

import { log } from './log.js';
import {
  getConfig,
  removeConfig,
  setConfig,
} from './config.js';
import { urlCache } from './url-cache.js';

export const GH_URL = 'https://github.com/';

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
    return getConfig('sync', `${owner}/${repo}`);
  }
  return undefined;
}

/**
 * Returns all project configurations.
 * @returns {Promise<Object[]>} The project configurations
 */
export async function getProjects() {
  return Promise.all((await getConfig('sync', 'projects')
    || await getConfig('sync', 'hlxSidekickProjects') || []) // legacy
    .map((handle) => getProject(handle)));
}

/**
 * Updates a project configuration.
 * @param {Object} project The project settings
 * @returns {Promise<Object>} The project configuration
 */
export async function updateProject(project) {
  const { owner, repo } = project;
  if (owner && repo) {
    // sanitize input
    Object.keys(project).forEach((key) => {
      if (!project[key]) {
        delete project[key];
      }
    });
    const handle = `${owner}/${repo}`;
    // update project config
    await setConfig('sync', {
      [handle]: project,
    });
    // update project index
    const projects = await getConfig('sync', 'projects') || [];
    if (!projects.includes(handle)) {
      projects.push(handle);
      await setConfig('sync', { projects });
    }
    log.info('updated project', project);
    // todo: alert
    return project;
  }
  return null;
}

/**
 * Validates a project config.
 * @param {Object} config The project config
 * @returns {boolean} true if valid project config, else false
 */
export function isValidProject({ owner, repo, ref } = {}) {
  return !!(owner && repo && ref);
}

/**
 * Extracts settings from a GitHub URL.
 * @param {string} giturl The GitHub URL
 * @returns {Object} The GitHub settings
 */
export function getGitHubSettings(giturl) {
  if (typeof giturl === 'string' && giturl.startsWith(GH_URL)) {
    const [owner, repository,, ref = 'main'] = new URL(giturl).pathname.toLowerCase()
      .substring(1).split('/');
    if (owner && repository) {
      const repo = repository.endsWith('.git') ? repository.split('.git')[0] : repository;
      return {
        owner,
        repo,
        ref,
      };
    }
  }
  return {};
}

/**
 * Extracts settings from a share URL.
 * @param {string} shareurl The share URL
 * @returns {Object} The share settings
 */
function getShareSettings(shareurl) {
  try {
    const { host, pathname, searchParams } = new URL(shareurl);
    if (host === 'www.aem.live' && pathname === '/tools/sidekick/') {
      const giturl = searchParams.get('giturl');
      const project = searchParams.get('project');
      if (giturl && isValidProject(getGitHubSettings(giturl))) {
        return {
          giturl,
          project,
        };
      }
    }
  } catch (e) {
    // ignore
  }
  return {};
}

/**
 * Tries to retrieve a project config from a URL.
 * @param {string} url The URL of the tab
 * @returns {Promise<Object>} The project config
 */
export async function getProjectFromUrl(url) {
  if (!url) {
    return {};
  }
  const shareSettings = getShareSettings(url);
  if (shareSettings.giturl) {
    // share url
    return getGitHubSettings(shareSettings.giturl);
  } else {
    // github url
    const ghSettings = getGitHubSettings(url);
    if (isValidProject(ghSettings)) {
      return ghSettings;
    }
    try {
      // check if hlx.page, hlx.live, aem.page or aem.live url
      const { host } = new URL(url);
      const res = /(.*)--(.*)--(.*)\.(aem|hlx)\.(page|live)/.exec(host);
      const [, urlRef, urlRepo, urlOwner] = res || [];
      if (urlOwner && urlRepo && urlRef) {
        return {
          owner: urlOwner,
          repo: urlRepo,
          ref: urlRef,
        };
      } else {
        // check if url is known in url cache
        const { owner, repo } = (await urlCache.get(url))
          .find((r) => r.originalRepository) || {};
        if (owner && repo) {
          return {
            owner,
            repo,
            ref: 'main',
          };
        }
      }
    } catch (e) {
      // ignore invalid url
    }
  }
  return {};
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
 * @param {string} [config.ref] The ref or branch (default: main)
 * @param {string} [config.authToken] The auth token
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
    /**
     * @type {RequestInit}
     */
    const options = {
      cache: 'no-store',
      credentials: 'include',
      headers: authToken ? { 'x-auth-token': authToken } : {},
    };

    res = await fetch(`https://admin.hlx.page/sidekick/${owner}/${repo}/${ref}/env.json`, options);
  } catch (e) {
    log.warn(`getProjectEnv: unable to retrieve project config: ${e}`);
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
  } else if (res && res.status === 401) {
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
    const { id: loginTabId } = await chrome.tabs.create({
      url: `https://admin.hlx.page/login/${owner}/${repo}/${ref}?extensionId=${chrome.runtime.id}`,
      active: true,
    });
    return new Promise((resolve) => {
      // retry adding project after sign in
      const retryAddProjectListener = async (message = {}) => {
        let added = false;
        if (message.authToken && owner === message.owner && repo === message.repo) {
          await chrome.tabs.remove(loginTabId);
          config.authToken = message.authToken;
          added = await addProject(config);
        }
        // clean up
        chrome.runtime.onMessageExternal.removeListener(retryAddProjectListener);
        resolve(added);
      };
      chrome.runtime.onMessageExternal.addListener(retryAddProjectListener);
    });
  }
  let project = await getProject(config);
  if (!project) {
    project = await updateProject({ ...config, ...env });
    log.info('added project', config);
    // todo: alert(i18n('config_add_success'));
    return true;
  } else {
    log.warn('project already exists', project);
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
  const projects = await getConfig('sync', 'projects')
    || await getConfig('sync', 'hlxSidekickProjects') || []; // legacy
  const i = projects.indexOf(handle);
  if (i >= 0) {
    // delete admin auth header rule
    chrome.runtime.sendMessage({ deleteAuthToken: { owner, repo } });
    // delete the project entry
    await removeConfig('sync', handle);
    // remove project entry from index
    projects.splice(i, 1);
    await setConfig('sync', { projects });
    log.info('project deleted', handle);
    // todo: alert
    return true;
  } else {
    log.warn('project to delete not found', handle);
    // todo: alert
  }
  return false;
}

/**
 * Toggles a project configuration.
 * @param {Object|string} project The project settings or handle
 * @returns {Promise<Boolean>} true if project exists, else false
 */
export async function toggleProject(project) {
  const config = await getProject(project);
  if (config) {
    await updateProject({
      ...config,
      disabled: !config.disabled,
    });
    return true;
  }
  return false;
}

/**
 * Checks if a host is a valid project host.
 * @private
 * @param {string} host The base host
 * @param {string} [owner] The owner
 * @param {string} [repo] The repo
 * @returns {boolean} true if valid project host, else false
 */
export function isValidHost(host, owner, repo) {
  const [third, second, first] = host.split('.');
  const any = '([0-9a-z-]+)';
  return host.endsWith(first)
    && ['page', 'live'].includes(first)
    && ['aem', 'hlx'].includes(second)
    && new RegExp(`--${repo || any}--${owner || any}$`, 'i').test(third);
}

/**
 * Retrieves project details from a host name.
 * @private
 * @param {string} host The host name
 * @returns {string[]} The project details as <code>[ref, repo, owner]</code>
 */
function getConfigDetails(host) {
  if (isValidHost(host)) {
    return host.split('.')[0].split('--');
  }
  return [];
}

/**
 * Returns matches from configured projects for a given tab URL.
 * @param {Object[]} configs The project configurations
 * @param {string} tabUrl The tab URL
 * @returns {Promise<Object[]>} The matches
 */
export async function getProjectMatches(configs, tabUrl) {
  const {
    host: checkHost,
  } = new URL(tabUrl);
  // exclude disabled configs
  const matches = configs
    .filter((cfg) => !cfg.disabled)
    .filter((cfg) => {
      const {
        owner,
        repo,
        host: prodHost,
        previewHost,
        liveHost,
      } = cfg;
      return checkHost === prodHost // production host
        || checkHost === previewHost // custom inner
        || checkHost === liveHost // custom outer
        || isValidHost(checkHost, owner, repo); // inner or outer
    });
  // check url cache if no matches
  const cachedResults = await urlCache.get(tabUrl);
  cachedResults.forEach((e) => {
    // add matches from url cache
    matches.push(...configs.filter(({ owner, repo }) => e.owner === owner && e.repo === repo));
  });
  // check if transient match can be derived from url or url cache
  if (matches.length === 0) {
    const [ref, repo, owner] = getConfigDetails(checkHost);
    if (owner && repo && ref) {
      matches.push({
        owner,
        repo,
        ref,
        transient: true,
      });
    }
  }
  if (matches.length === 0) {
    const { owner, repo } = cachedResults.find((r) => r.originalRepository) || {};
    if (owner && repo) {
      matches.push({
        owner,
        repo,
        ref: 'main',
        transient: true,
      });
    }
  }
  return matches
    // exclude disabled configs
    .filter(({ owner, repo }) => !configs
      .find((cfg) => cfg.owner === owner && cfg.repo === repo && cfg.disabled));
}
