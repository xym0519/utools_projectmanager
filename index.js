// region Redmine
const RedmineHost = 'http://redmine.project.360cbs.com:8090';
const RedmineDefaultTracker = 2;
const RedmineDefaultAssignedTo = 3;
const RedmineDefaultStatus = 1;
redmineStatus = {
    step: 'project',
    projects: [],
    selected: null,
    question: ''
};

function getRedmineKey() {
    let item = utools.db.get('redminekey');
    return item ? item.key : '';
}

function initRedmine() {
    let cache = utools.db.get('redminecache')
    redmineStatus.projects = JSON.parse(cache ? cache.key : '[]');
    loadRedmineData();
}

async function loadRedmineData() {
    let page = 0;
    let projects = [];
    while (true) {
        let res = await loadRedminePage(page);
        let list = res.projects;
        if (list.length > 0) {
            projects.push(...list);
            page++;
        } else {
            break;
        }
    }
    utools.db.put({_id: 'redminecache', key: JSON.stringify(projects)});
    redmineStatus.projects = projects;
}

async function loadRedminePage(page) {
    let offset = page * 100;
    let response = await fetch(RedmineHost + '/projects.json?limit=100&offset=' + offset + '&key=' + getRedmineKey());
    if (response.ok) {
        return await response.json();
    } else {
        window.utools.showNotification('获取项目列表失败');
        window.utools.hideMainWindow();
        window.utools.outPlugin();
    }
}

// endregion

// region Jenkins
const JenkinsHost = 'http://jenkins.project.360cbs.com:8090';
jenkinsStatus = {
    step: 'project',
    jobs: [],
    views: [],
    selected: null,
    selectedType: null
};

function getJenkinsKey() {
    let item = utools.db.get('jenkinskey');
    let key = item ? item.key : '';
    let keys = key.split('/');
    if (keys.length === 2) {
        return keys;
    } else {
        return ['', ''];
    }
}

function initJenkins() {
    let cacheJobs = utools.db.get('jenkinscache_jobs')
    let cacheViews = utools.db.get('jenkinscache_views')
    jenkinsStatus.jobs = JSON.parse(cacheJobs ? cacheJobs.key : '[]');
    jenkinsStatus.views = JSON.parse(cacheViews ? cacheViews.key : '[]');
    loadJenkinsData();
}

async function loadJenkinsData() {
    let response = await fetch(JenkinsHost + '/api/json?tree=jobs[name],views[name]', {headers: getJenkinsHeaders()});
    if (response.ok) {
        let data = await response.json();
        let jobs = data.jobs;
        let views = data.views;
        utools.db.put({_id: 'jenkinscache_jobs', key: JSON.stringify(jobs)});
        utools.db.put({_id: 'jenkinscache_views', key: JSON.stringify(views)});
        jenkinsStatus.jobs = jobs;
        jenkinsStatus.views = views;
    } else {
        window.utools.showNotification('获取项目列表失败');
        window.utools.hideMainWindow();
        window.utools.outPlugin();
    }
}

function getJenkinsHeaders() {
    let headers = new Headers();
    let keys = getJenkinsKey();
    headers.append('Authorization', 'Basic ' + new Buffer(keys[0] + ":" + keys[1]).toString('base64'));
    return headers;
}

// endregion

// region Gitlab
const GitlabHost = 'http://gitlab.project.360cbs.com:8090';
gitlabStatus = {
    step: 'group',
    groups: [],
    selected: null,
    projects: []
};

function getGitlabKey() {
    let item = utools.db.get('gitlabkey');
    return item ? item.key : '';
}

function initGitlab() {
    let cache = utools.db.get('gitlabcache_groups')
    gitlabStatus.groups = JSON.parse(cache ? cache.key : '[]');
    loadGitlabGroupData();
}

async function loadGitlabGroupData() {
    let page = 1;
    let groups = [];
    while (true) {
        let list = await loadGitlabPage(page);
        if (list.length > 0) {
            groups.push(...list);
            page++;
        } else {
            break;
        }
    }
    utools.db.put({_id: 'gitlabcache_groups', key: JSON.stringify(groups)});
    gitlabStatus.groups = groups;
}

async function loadGitlabPage(page) {
    let response = await fetch(GitlabHost + '/api/v4/groups?order_by=name&sort=asc&per_page=100&page=' + page + '&private_token=' + getGitlabKey());
    if (response.ok) {
        return await response.json();
    } else {
        window.utools.showNotification('获取分组列表失败');
        window.utools.hideMainWindow();
        window.utools.outPlugin();
    }
}

function getGitlabProjects(groupid) {
    let cache = utools.db.get('gitlabcache_groups_' + groupid)
    let data = JSON.parse(cache ? cache.key : '[]');
    loadGitlabProjectData(groupid);
    return data;
}

async function loadGitlabProjectData(groupid) {
    let response = await fetch(GitlabHost + '/api/v4/groups/' + groupid + '/projects?order_by=name&sort=asc&per_page=100&private_token=' + getGitlabKey());
    if (response.ok) {
        let projects = await response.json();
        utools.db.put({_id: 'gitlabcache_groups_' + groupid, key: JSON.stringify(projects)});
    } else {
        window.utools.showNotification('获取分组列表失败');
        window.utools.hideMainWindow();
        window.utools.outPlugin();
    }
}

// endregion

// region Common
function checkKeyword(key, name) {
    if (!key) {
        return true;
    }
    let keys = key.split(' ');
    return keys.every(item => {
        return name.toLowerCase().includes(item.toLowerCase());
    });
}

// endregion

window.exports = {
    redmine: {
        mode: 'list',
        args: {
            placeholder: '请输入...',
            enter: () => {
                redmineStatus = {
                    step: 'project',
                    projects: [],
                    selected: null,
                    question: ''
                };
                initRedmine();
            },
            search: async (action, searchWord, callbackSetList) => {
                searchWord = searchWord.trim().toLowerCase();
                if (redmineStatus.step === 'project') {
                    let list = [];
                    redmineStatus.projects.forEach(item => {
                        if (checkKeyword(searchWord, item.identifier) || checkKeyword(searchWord, item.name)) {
                            list.push({
                                icon: 'image/redmine.png',
                                title: item.identifier,
                                description: item.name,
                                data: item
                            });
                        }
                    });
                    callbackSetList(list)
                } else if (redmineStatus.step === 'action') {
                    redmineStatus.question = searchWord;
                }
            },
            select: (action, item, callbackSetList) => {
                if (redmineStatus.step === 'project') {
                    redmineStatus.step = 'action';
                    redmineStatus.selected = item.data;
                    let list = [
                        {
                            title: '打开项目',
                            description: redmineStatus.selected.name + '(' + redmineStatus.selected.identifier + ')',
                            action: 'open'
                        },
                        {
                            title: '输入问题后回车保存',
                            description: redmineStatus.selected.name + '(' + redmineStatus.selected.identifier + ')',
                            action: 'save'
                        }
                    ];
                    callbackSetList(list);
                    utools.setSubInputValue('');
                    utools.subInputFocus();
                } else if (redmineStatus.step === 'action') {
                    if (item.action === 'save') {
                        if (!redmineStatus.question) {
                            window.utools.showNotification('请输入问题');
                            return;
                        }
                        let body = {
                            issue: {
                                project_id: redmineStatus.selected.id,
                                subject: redmineStatus.question,
                                tracker_id: RedmineDefaultTracker,
                                assigned_to_id: RedmineDefaultAssignedTo,
                                status_id: RedmineDefaultStatus
                            }
                        };
                        window.fetch(RedmineHost + '/issues.json?key=' + getRedmineKey(), {
                            method: 'post',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(body)
                        }).then(response => {
                            if (response.ok) {
                                window.utools.showNotification('添加成功');
                                window.utools.hideMainWindow();
                                window.utools.outPlugin();
                            } else {
                                window.utools.showNotification('添加失败');
                            }
                        });
                    } else if (item.action === 'open') {
                        utools.shellOpenExternal(RedmineHost + '/projects/' + redmineStatus.selected.identifier + '/issues');
                        window.utools.hideMainWindow();
                        window.utools.outPlugin();
                    }
                }
            }
        }
    },
    jenkins: {
        mode: 'list',
        args: {
            placeholder: '请输入...',
            enter: () => {
                jenkinsStatus = {
                    step: 'project',
                    jobs: [],
                    selected: null
                };
                initJenkins();
            },
            search: async (action, searchWord, callbackSetList) => {
                searchWord = searchWord.trim().toLowerCase();
                if (jenkinsStatus.step === 'project') {
                    let list = [];
                    jenkinsStatus.jobs.forEach(item => {
                        if (checkKeyword(searchWord, item.name)) {
                            list.push({
                                icon: 'image/jenkins.png',
                                title: item.name + ' [Job]',
                                description: '请选择项目',
                                data: item,
                                itemType: 'job'
                            });
                        }
                    });
                    jenkinsStatus.views.forEach(item => {
                        if (checkKeyword(searchWord, item.name)) {
                            list.push({
                                title: item.name + ' [View]',
                                description: '请选择项目',
                                data: item,
                                itemType: 'view'
                            });
                        }
                    });
                    callbackSetList(list)
                }
            },
            select: (action, item, callbackSetList) => {
                if (jenkinsStatus.step === 'project') {
                    jenkinsStatus.step = 'action';
                    jenkinsStatus.selected = item.data;
                    jenkinsStatus.selectedType = item.itemType
                    let list = [];
                    if (item.itemType === 'job') {
                        list = [
                            {
                                title: '构建任务',
                                description: jenkinsStatus.selected.name,
                                action: 'build'
                            },
                            {
                                title: '打开任务',
                                description: jenkinsStatus.selected.name,
                                action: 'open'
                            },
                            {
                                title: '构建并打开',
                                description: jenkinsStatus.selected.name,
                                action: 'buildopen'
                            }
                        ];
                    } else {
                        list = [
                            {
                                title: '打开视图',
                                description: jenkinsStatus.selected.name,
                                action: 'openview'
                            }
                        ];
                    }
                    callbackSetList(list);
                    utools.setSubInputValue(jenkinsStatus.selected.name);
                    utools.subInputBlur();
                    // utools.removeSubInput();
                    // utools.subInputFocus();
                } else if (jenkinsStatus.step === 'action') {
                    if (item.action === 'build') {
                        window.fetch(JenkinsHost + '/job/' + jenkinsStatus.selected.name + '/build?delay=0', {
                            method: 'post',
                            headers: getJenkinsHeaders()
                        }).then(response => {
                            if (response.ok) {
                                window.utools.showNotification('构建成功');
                                window.utools.hideMainWindow();
                                window.utools.outPlugin();
                            } else {
                                window.utools.showNotification('构建失败');
                            }
                        });
                    } else if (item.action === 'buildopen') {
                        window.fetch(JenkinsHost + '/job/' + jenkinsStatus.selected.name + '/build?delay=0', {
                            method: 'post',
                            headers: getJenkinsHeaders()
                        }).then(response => {
                            if (response.ok) {
                                utools.shellOpenExternal(JenkinsHost + '/job/' + jenkinsStatus.selected.name + '/');
                                window.utools.showNotification('构建成功');
                                window.utools.hideMainWindow();
                                window.utools.outPlugin();
                            } else {
                                window.utools.showNotification('构建失败');
                            }
                        });
                    } else if (item.action === 'open') {
                        utools.shellOpenExternal(JenkinsHost + '/job/' + jenkinsStatus.selected.name + '/');
                        window.utools.hideMainWindow();
                        window.utools.outPlugin();
                    } else if (item.action === 'openview') {
                        utools.shellOpenExternal(JenkinsHost + '/view/' + jenkinsStatus.selected.name + '/');
                        window.utools.hideMainWindow();
                        window.utools.outPlugin();
                    }
                }
            }
        }
    },
    gitlab: {
        mode: 'list',
        args: {
            placeholder: '请输入...',
            enter: () => {
                gitlabStatus = {
                    step: 'group',
                    groups: [],
                    selected: null,
                    projects: []
                };
                initGitlab();
            },
            search: async (action, searchWord, callbackSetList) => {
                searchWord = searchWord.trim().toLowerCase();
                let list = [];
                if (gitlabStatus.step === 'group') {
                    gitlabStatus.groups.forEach(item => {
                        if (checkKeyword(searchWord, item.name) || checkKeyword(searchWord, item.full_name)) {
                            list.push({
                                icon: 'image/gitlab.png',
                                title: item.name,
                                description: '请选择分组',
                                data: item
                            });
                        }
                    });
                } else if (gitlabStatus.step === 'project') {
                    gitlabStatus.projects.forEach(item => {
                        if (checkKeyword(searchWord, item.title) || checkKeyword(searchWord, item.type)) {
                            list.push(item);
                        }
                    });
                }
                callbackSetList(list)
            },
            select: (action, item, callbackSetList) => {
                if (gitlabStatus.step === 'group') {
                    gitlabStatus.step = 'project';
                    gitlabStatus.selected = item.data;
                    gitlabStatus.projects = [
                        {
                            title: '打开分组',
                            description: gitlabStatus.selected.name,
                            web_url: GitlabHost + '/groups/' + gitlabStatus.selected.path,
                            type: 'group'
                        }
                    ];
                    let projects = getGitlabProjects(item.data.id);
                    projects.forEach(project => {
                        gitlabStatus.projects.push({
                            icon: 'image/gitlab.png',
                            title: project.name,
                            description: gitlabStatus.selected.name,
                            web_url: GitlabHost + '/' + gitlabStatus.selected.path + '/' + project.path,
                            type: 'project'
                        });
                    });
                    callbackSetList(gitlabStatus.projects)
                    utools.setSubInputValue('');
                    // utools.subInputBlur();
                    // utools.removeSubInput();
                    utools.subInputFocus();
                } else if (gitlabStatus.step === 'project') {
                    utools.shellOpenExternal(item.web_url);
                    window.utools.hideMainWindow();
                    window.utools.outPlugin();
                }
            }
        }
    },
    jenkinssetting: {
        mode: 'list',
        args: {
            placeholder: '请输入...',
            enter: (action, callbackSetList) => {
                let item = utools.db.get('jenkinskey');
                if (!item) {
                    item = {_id: 'jenkinskey', key: ''};
                }
                callbackSetList([{
                    title: item ? item.key : '',
                    description: '请修改后保存',
                    data: item
                }]);
            },
            search: async (action, searchWord, callbackSetList) => {
                let item = utools.db.get('jenkinskey');
                if (!item) {
                    item = {_id: 'jenkinskey', key: searchWord};
                } else {
                    item.key = searchWord;
                }
                callbackSetList([{
                    title: 'Jenkins Key Setting',
                    description: '请输入后保存',
                    data: item
                }]);
            },
            select: async (action, item) => {
                utools.db.put(item.data);
                console.log(item)
                window.utools.hideMainWindow();
                window.utools.outPlugin();
            }
        }
    },
    redminesetting: {
        mode: 'list',
        args: {
            placeholder: '请输入...',
            enter: (action, callbackSetList) => {
                let item = utools.db.get('redminekey');
                if (!item) {
                    item = {_id: 'redminekey', key: ''};
                }
                callbackSetList([{
                    title: item ? item.key : '',
                    description: '请修改后保存',
                    data: item
                }]);
            },
            search: async (action, searchWord, callbackSetList) => {
                let item = utools.db.get('redminekey');
                if (!item) {
                    item = {_id: 'redminekey', key: searchWord};
                } else {
                    item.key = searchWord;
                }
                callbackSetList([{
                    title: 'Redmine Key Setting',
                    description: '请输入后保存',
                    data: item
                }]);
            },
            select: async (action, item) => {
                utools.db.put(item.data);
                console.log(item)
                window.utools.hideMainWindow();
                window.utools.outPlugin();
            }
        }
    },
    gitlabsetting: {
        mode: 'list',
        args: {
            placeholder: '请输入...',
            enter: (action, callbackSetList) => {
                let item = utools.db.get('gitlabkey');
                if (!item) {
                    item = {_id: 'gitlabkey', key: ''};
                }
                callbackSetList([{
                    title: item ? item.key : '',
                    description: '请修改后保存',
                    data: item
                }]);
            },
            search: async (action, searchWord, callbackSetList) => {
                let item = utools.db.get('gitlabkey');
                if (!item) {
                    item = {_id: 'gitlabkey', key: searchWord};
                } else {
                    item.key = searchWord;
                }
                callbackSetList([{
                    title: 'Gitlab Key Setting',
                    description: '请输入后保存',
                    data: item
                }]);
            },
            select: async (action, item) => {
                utools.db.put(item.data);
                console.log(item)
                window.utools.hideMainWindow();
                window.utools.outPlugin();
            }
        }
    }
}
