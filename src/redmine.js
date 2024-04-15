import utils from "./utils";

const DefaultTracker = 2;
const DefaultAssignedTo = 3;
const DefaultStatus = 1;

let step = 'project';
let data = [];
let selected = null;
let question = '';

function getSetting() {
    let setting = utools.db.get('redminesetting');
    if (!setting || !setting.host || !setting.key) {
        utools.showNotification('获取列表失败');
        utools.hideMainWindow();
        utools.outPlugin();
    }
    return setting;
}

function init() {
    let cache = utools.db.get('redminecache')
    data = JSON.parse(cache ? cache.data : '[]');
    loadData();
}

async function loadData() {
    let page = 0;
    let projectList = [];
    while (true) {
        let res = await loadPage(page);
        if (res && res.projects && res.projects.length > 0) {
            res.projects.forEach(item => {
                projectList.push({id: item.id, name: item.name, identifier: item.identifier});
            })
            page++;
        } else {
            break;
        }
    }
    let cache = utools.db.get('redminecache')
    if (!cache) cache = {_id: 'redminecache'};

    cache.data = JSON.stringify(projectList);
    utools.db.put(cache);
    data = projectList;
}

async function loadPage(page) {
    let setting = getSetting();
    let offset = page * 100;
    let response = await fetch(setting.host + '/projects.json?limit=100&offset=' + offset + '&key=' + setting.key);
    if (response.ok) {
        return await response.json();
    } else {
        utools.showNotification('获取列表失败');
        utools.hideMainWindow();
        utools.outPlugin();
    }
}

function open(item) {
    let setting = getSetting();
    utools.shellOpenExternal(setting.host + '/projects/' + item.identifier + '/issues');
    utools.hideMainWindow();
    utools.outPlugin();
}

function addQuestion(item, question) {
    let setting = getSetting();
    if (!question) {
        utools.showNotification('请输入问题');
        return;
    }
    let body = {
        issue: {
            project_id: item.id,
            subject: question,
            tracker_id: DefaultTracker,
            assigned_to_id: DefaultAssignedTo,
            status_id: DefaultStatus
        }
    };
    window.fetch(setting.host + '/issues.json?key=' + setting.key, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }).then(response => {
        if (response.ok) {
            utools.showNotification('添加成功');
            utools.hideMainWindow();
            utools.outPlugin();
        } else {
            utools.showNotification('添加失败');
        }
    });
}

const redmine = {
    mode: 'list',
    args: {
        placeholder: '请输入...',
        enter: () => {
            step = 'project';
            data = [];
            selected = null;
            question = '';
            init();
        },
        search: async (action, searchWord, callbackSetList) => {
            searchWord = searchWord.trim().toLowerCase();
            if (step === 'project') {
                let list = [];
                data.forEach(item => {
                    if (utils.checkKeyword(searchWord, item.identifier) || utils.checkKeyword(searchWord, item.name)) {
                        list.push({
                            icon: 'image/redmine.png',
                            title: item.identifier,
                            description: item.name,
                            data: item
                        });
                    }
                });
                callbackSetList(list)
            } else if (step === 'action') {
                question = searchWord;
            }
        },
        select: (action, item, callbackSetList) => {
            if (step === 'project') {
                step = 'action';
                selected = item.data;
                let list = [
                    {
                        title: '打开项目',
                        description: selected.name + '(' + selected.identifier + ')',
                        action: 'open'
                    },
                    {
                        title: '输入问题后回车保存',
                        description: selected.name + '(' + selected.identifier + ')',
                        action: 'save'
                    }
                ];
                callbackSetList(list);
                utools.setSubInputValue('');
                utools.subInputFocus();
            } else if (step === 'action') {
                if (item.action === 'save') {
                    addQuestion(selected, question);
                } else if (item.action === 'open') {
                    open(selected)
                }
            }
        }
    }
}

export default redmine