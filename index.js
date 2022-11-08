redmineStatus = {
    step: 'project',
    projects: null,
    selected: null,
    question: ''
};

async function initRedmine() {
    let response = await fetch('http://redmine.project.360cbs.com:8090/projects.json?key=e933a9f1e721597802d289bebd87fb75830e867b');
    if (response.ok) {
        redmineStatus.projects = (await response.json()).projects;
    } else {
        window.utools.showNotification('获取项目列表失败');
        window.utools.hideMainWindow();
        window.utools.outPlugin();
    }
}

window.exports = {
    redmine: {
        mode: 'list',
        args: {
            placeholder: '请输入...',
            search: async (action, searchWord, callbackSetList) => {
                searchWord = searchWord.trim()
                if (redmineStatus.step === 'project') {
                    if (redmineStatus.projects === null) {
                        await initRedmine();
                    }
                    let list = [];
                    redmineStatus.projects.forEach(item => {
                        if (item.name.includes(searchWord) || item.identifier.includes(searchWord)) {
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
                            title: redmineStatus.selected.name + '(' + redmineStatus.selected.identifier + ')',
                            description: '输入问题后回车保存',
                            action: 'save'
                        },
                        {
                            title: redmineStatus.selected.name + '(' + redmineStatus.selected.identifier + ')',
                            description: '打开项目',
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
                        window.fetch('http://redmine.project.360cbs.com:8090/issues.json?key=e933a9f1e721597802d289bebd87fb75830e867b', {
                            method: 'post',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(body)
                        }).then(response => {
                            window.utools.showNotification(response.status === 201 ? '添加成功' : '添加失败');
                            window.utools.hideMainWindow();
                            window.utools.outPlugin();
                        });
                    } else if (item.action === 'open') {
                        utools.shellOpenExternal('http://redmine.project.360cbs.com:8090/projects/' + redmineStatus.selected.identifier + '/issues');
                        window.utools.hideMainWindow();
                        window.utools.outPlugin();
                    }
                }

            }
        }
    }
}
