redmineStatus = {
    step: 'project',
    projects: [],
    selected: null,
    question: ''
};

jenkinsStatus = {
    step: 'project',
    jobs: [],
    selected: null
};

gitlabStatus = {
    step: 'group',
    groups: [],
    selected: null,
    projects: []
};

function getRedmineKey() {
    let item = utools.db.get('redminekey');
    return item ? item.key : '';
}

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

function getGitlabKey() {
    let item = utools.db.get('gitlabkey');
    return item ? item.key : '';
}

async function initRedmine() {
    let response = await fetch('http://redmine.project.360cbs.com:8090/projects.json?key=' + getRedmineKey());
    if (response.ok) {
        redmineStatus.projects = (await response.json()).projects;
    } else {
        window.utools.showNotification('获取项目列表失败');
        window.utools.hideMainWindow();
        window.utools.outPlugin();
    }
}

async function initJenkins() {
    let response = await fetch('http://jenkins.project.360cbs.com:8090/api/json?tree=jobs[name]', {headers: getJenkinsHeaders()});
    if (response.ok) {
        jenkinsStatus.jobs = (await response.json()).jobs;
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

async function initGitlab() {
    let page = 1;
    while (true) {
        let list = await initGitlabPage(page);
        if (list.length > 0) {
            gitlabStatus.groups.push(...list);
            page++;
        } else {
            break;
        }
    }
}

async function initGitlabPage(page) {
    let response = await fetch('http://gitlab.project.360cbs.com:8090/api/v4/groups?order_by=name&sort=asc&per_page=100&page=' + page + '&private_token=' + getGitlabKey());
    if (response.ok) {
        return await response.json();
    } else {
        window.utools.showNotification('获取分组列表失败');
        window.utools.hideMainWindow();
        window.utools.outPlugin();
    }
}

async function loadGitlabProjects(groupid) {
    let response = await fetch('http://gitlab.project.360cbs.com:8090/api/v4/groups/' + groupid + '/projects?order_by=name&sort=asc&per_page=100&private_token=' + getGitlabKey());
    if (response.ok) {
        return await response.json();
    } else {
        window.utools.showNotification('获取分组列表失败');
        window.utools.hideMainWindow();
        window.utools.outPlugin();
    }
}

function checkKeyword(key, name) {
    if (!key) {
        return true;
    }
    let keys = key.split(' ');
    return keys.every(item => {
        return name.toLowerCase().includes(item.toLowerCase());
    });
}

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
                            title: '输入问题后回车保存',
                            description: redmineStatus.selected.name + '(' + redmineStatus.selected.identifier + ')',
                            action: 'save'
                        },
                        {
                            title: '打开项目',
                            description: redmineStatus.selected.name + '(' + redmineStatus.selected.identifier + ')',
                            action: 'open'
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
                                tracker_id: 6,
                                assigned_to_id: 3,
                                status_id: 1
                            }
                        };
                        window.fetch('http://redmine.project.360cbs.com:8090/issues.json?key=' + getRedmineKey(), {
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
                        utools.shellOpenExternal('http://redmine.project.360cbs.com:8090/projects/' + redmineStatus.selected.identifier + '/issues');
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
                                title: item.name,
                                description: '请选择项目',
                                data: item
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
                    let list = [
                        {
                            title: '打开任务',
                            description: jenkinsStatus.selected.name,
                            action: 'open'
                        },
                        {
                            title: '构建任务',
                            description: jenkinsStatus.selected.name,
                            action: 'build'
                        }
                    ];
                    callbackSetList(list);
                    utools.setSubInputValue(jenkinsStatus.selected.name);
                    utools.subInputBlur();
                    // utools.removeSubInput();
                    // utools.subInputFocus();
                } else if (jenkinsStatus.step === 'action') {
                    if (item.action === 'build') {
                        window.fetch('http://jenkins.project.360cbs.com:8090/job/' + jenkinsStatus.selected.name + '/build?delay=0', {
                            method: 'post',
                            headers: getJenkinsHeaders()
                        }).then(response => {
                            if (response.ok) {
                                utools.shellOpenExternal('http://jenkins.project.360cbs.com:8090/job/' + jenkinsStatus.selected.name + '/');
                                window.utools.showNotification('构建成功');
                                window.utools.hideMainWindow();
                                window.utools.outPlugin();
                            } else {
                                window.utools.showNotification('构建失败');
                            }
                        });
                    } else if (item.action === 'open') {
                        utools.shellOpenExternal('http://jenkins.project.360cbs.com:8090/job/' + jenkinsStatus.selected.name + '/');
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
            select: async (action, item, callbackSetList) => {
                if (gitlabStatus.step === 'group') {
                    gitlabStatus.step = 'project';
                    gitlabStatus.selected = item.data;
                    gitlabStatus.projects = [
                        {
                            title: '打开分组',
                            description: gitlabStatus.selected.name,
                            web_url: gitlabStatus.selected.web_url,
                            type: 'group'
                        }
                    ];
                    let projects = await loadGitlabProjects(item.data.id);
                    projects.forEach(project => {
                        gitlabStatus.projects.push({
                            title: project.name,
                            description: gitlabStatus.selected.name,
                            web_url: project.web_url,
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
