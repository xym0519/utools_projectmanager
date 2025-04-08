import utils from "./utils";

let step = 'group';
let data = {};
let selected = null;

function getSetting() {
    let setting = utools.db.get('gitlabsetting');
    if (!setting || !setting.host || !setting.key) {
        utools.showNotification('获取列表失败');
        utools.hideMainWindow();
        utools.outPlugin();
    }
    return setting;
}

function init() {
    let cache = utools.db.get('gitlabcache')
    data = JSON.parse(cache ? cache.data : '{}');
    loadGroupData();
}

async function loadGroupData() {
    let page = 1;
    let groupList = {};
    while (true) {
        let res = await loadGroupPage(page);
        if (res && res.length > 0) {
            res.forEach(item => {
                groupList['i' + item.id] = {id: item.id, name: item.path};
            })
            page++;
        } else {
            break;
        }
    }

    Object.values(groupList).forEach(group => {
        if (data['i' + group.id] == null) {
            data['i' + group.id] = group;
        }
    });

    let cache = utools.db.get('gitlabcache')
    if (!cache) cache = {_id: 'gitlabcache'};
    cache.data = JSON.stringify(data);
    utools.db.put(cache);
}

async function loadGroupPage(page) {
    let setting = getSetting();
    let response = await fetch(setting.host + '/api/v4/groups?order_by=name&sort=asc&per_page=100&page=' + page + '&private_token=' + setting.key);
    if (response.ok) {
        return await response.json();
    } else {
        utools.showNotification('获取列表失败');
        utools.hideMainWindow();
        utools.outPlugin();
    }
}

async function loadProjectData(groupid) {
    if (data['i' + groupid] == null) {
        utools.showNotification('获取列表失败');
        utools.hideMainWindow();
        utools.outPlugin();
        return;
    }

    let setting = getSetting();
    let response = await fetch(setting.host + '/api/v4/groups/' + groupid + '/projects?order_by=name&sort=asc&per_page=100&private_token=' + setting.key);
    if (response.ok) {
        let projects = await response.json();
        data['i' + groupid]['projects'] = projects.map(item => ({id: item.id, name: item.path}));

        let cache = utools.db.get('gitlabcache')
        if (!cache) cache = {_id: 'gitlabcache'};
        cache.data = JSON.stringify(data);
        utools.db.put(cache);
    } else {
        utools.showNotification('获取列表失败');
        utools.hideMainWindow();
        utools.outPlugin();
    }
}

function open(item) {
    let setting = getSetting();
    if (item.type === 'group') {
        utools.shellOpenExternal(setting.host + '/groups/' + item.data);
    } else {
        utools.shellOpenExternal(setting.host + '/' + selected.name + '/' + item.data.name);
    }
    utools.hideMainWindow();
    utools.outPlugin();
}

const gitlab = {
    mode: 'list',
    args: {
        placeholder: '请输入...',
        enter: () => {
            step = 'group';
            data = {};
            selected = null;
            init();
        },
        search: async (action, searchWord, callbackSetList) => {
            searchWord = searchWord.trim().toLowerCase();
            let list = [];
            if (step === 'group') {
                Object.values(data).forEach(item => {
                    if (utils.checkKeyword(searchWord, item.name)) {
                        list.push({
                            icon: 'image/gitlab.png',
                            title: item.name,
                            description: '请选择分组',
                            data: item
                        });
                    }
                });
            } else if (step === 'project') {
                if (searchWord === '') {
                    list.push(
                        {
                            title: '打开分组',
                            description: selected.name,
                            type: 'group',
                            data: selected.name
                        }
                    );
                }
                if (selected.projects) {
                    selected.projects.forEach(item => {
                        if (utils.checkKeyword(searchWord, item.name)) {
                            list.push({
                                icon: 'image/gitlab.png',
                                title: item.name,
                                description: selected.name,
                                type: 'project',
                                data: item
                            });
                        }
                    })
                }
            }
            callbackSetList(list)
        },
        select: (action, item, callbackSetList) => {
            if (step === 'group') {
                step = 'project';
                selected = item.data;

                loadProjectData(item.data.id)
                utools.setSubInputValue('');
                callbackSetList({});
                utools.subInputFocus();
            } else if (step === 'project') {
                open(item)
            }
        }
    }
}

export default gitlab