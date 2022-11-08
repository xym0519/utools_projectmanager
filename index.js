RedmineKey = 'e933a9f1e721597802d289bebd87fb75830e867b';
JenkinsUsername = '360cbs';
JenkinsKey = '11597ffad1372d9dab6a3ac0e6221b7a4f';
GitlabKey = 'yn39JxdtSuBfMssQhS1N';

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

async function initRedmine() {
    let response = await fetch('http://redmine.project.360cbs.com:8090/projects.json?key=' + RedmineKey);
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
    headers.append('Authorization', 'Basic ' + new Buffer(JenkinsUsername + ":" + JenkinsKey).toString('base64'));
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
    let response = await fetch('http://gitlab.project.360cbs.com:8090/api/v4/groups?order_by=name&sort=asc&per_page=100&page=' + page + '&private_token=' + GitlabKey);
    if (response.ok) {
        return await response.json();
    } else {
        window.utools.showNotification('获取分组列表失败');
        window.utools.hideMainWindow();
        window.utools.outPlugin();
    }
}

async function loadGitlabProjects(groupid) {
    let response = await fetch('http://gitlab.project.360cbs.com:8090/api/v4/groups/' + groupid + '/projects?order_by=name&sort=asc&per_page=100&private_token=' + GitlabKey);
    if (response.ok) {
        return await response.json();
    } else {
        window.utools.showNotification('获取分组列表失败');
        window.utools.hideMainWindow();
        window.utools.outPlugin();
    }
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
                        if (item.name.toLowerCase().includes(searchWord) || item.identifier.toLowerCase().includes(searchWord)) {
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
                        window.fetch('http://redmine.project.360cbs.com:8090/issues.json?key=' + RedmineKey, {
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
                        if (item.name.toLowerCase().includes(searchWord)) {
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
                        window.fetch('http://jenkins.project.360cbs.com:8090/job/' + jenkinsStatus.selected.name + '/build', {
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
                        if (item.name.toLowerCase().includes(searchWord) || item.full_name.toLowerCase().includes(searchWord)) {
                            list.push({
                                title: item.name,
                                description: '请选择分组',
                                data: item
                            });
                        }
                    });
                } else if (gitlabStatus.step === 'project') {
                    gitlabStatus.projects.forEach(item => {
                        if (item.title.toLowerCase().includes(searchWord) || item.type.toLowerCase().includes(searchWord)) {
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
    }
}
