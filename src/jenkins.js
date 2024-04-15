import utils from "./utils";

let step = 'project';
let data = [];
let selected = null;

function getSetting() {
    let setting = utools.db.get('jenkinssetting');
    if (!setting || !setting.host || !setting.ak || !setting.sk) {
        utools.showNotification('获取列表失败');
        utools.hideMainWindow();
        utools.outPlugin();
    }
    return setting;
}

function init() {
    let cache = utools.db.get('jenkinscache')
    data = JSON.parse(cache ? cache.data : '[]');
    loadData();
}

async function loadData() {
    let setting = getSetting()
    let headers = new Headers();
    headers.append('Authorization', 'Basic ' + new Buffer(setting.ak + ":" + setting.sk).toString('base64'));
    let response = await fetch(setting.host + '/api/json?tree=jobs[name],views[name]', {headers: headers});
    if (response.ok) {
        let data = await response.json();
        let jobList = data.jobs.map(item => ({'name': item.name, 'itemType': 'job'}));
        let viewList = data.views.map(item => ({'name': item.name, 'itemType': 'view'}));
        let list = [...viewList, ...jobList];
        let cache = utools.db.get('jenkinscache');
        if (!cache) cache = {_id: 'jenkinscache'};
        cache.data = JSON.stringify(list);
        utools.db.put(cache);
        data = list;
    } else {
        utools.showNotification('获取列表失败');
        utools.hideMainWindow();
        utools.outPlugin();
    }
}

function open(item) {
    let setting = getSetting();
    if (item.itemType === 'job') {
        utools.shellOpenExternal(setting.host + '/job/' + item.name + '/');
    } else if (item.itemType === 'view') {
        utools.shellOpenExternal(setting.host + '/view/' + item.name + '/');
    }
    utools.hideMainWindow();
    utools.outPlugin();
}

function build(item, openFlag = false) {
    let setting = getSetting();
    let headers = new Headers();
    headers.append('Authorization', 'Basic ' + new Buffer(setting.ak + ":" + setting.sk).toString('base64'));
    window.fetch(setting.host + '/job/' + item.name + '/build?delay=0', {
        method: 'post',
        headers: headers
    }).then(response => {
        if (response.ok) {
            utools.showNotification('构建成功');
            if (openFlag) {
                open(item);
            } else {
                utools.hideMainWindow();
                utools.outPlugin();
            }
        } else {
            utools.showNotification('构建失败');
        }
    });
}

const jenkins = {
    mode: 'list',
    args: {
        placeholder: '请输入...',
        enter: () => {
            step = 'project';
            data = [];
            selected = null;
            init();
        },
        search: async (action, searchWord, callbackSetList) => {
            searchWord = searchWord.trim().toLowerCase();
            if (step === 'project') {
                let list = [];
                data.some(item => {
                    if (utils.checkKeyword(searchWord, item.name)) {
                        let titleType = 'View';
                        if (item.itemType === 'job') titleType = 'Job';
                        list.push({
                            icon: 'image/jenkins.png',
                            title: '[' + titleType + '] ' + item.name,
                            description: '请选择项目',
                            data: item,
                            itemType: item.itemType
                        });
                        return list.length > 9;
                    }
                });
                callbackSetList(list)
            }
        },
        select: (action, item, callbackSetList) => {
            if (step === 'project') {
                step = 'action';
                selected = item.data;
                let list = [];
                if (item.itemType === 'job') {
                    list = [
                        {
                            title: '构建任务',
                            description: selected.name,
                            action: 'build'
                        },
                        {
                            title: '打开任务',
                            description: selected.name,
                            action: 'open'
                        },
                        {
                            title: '构建并打开',
                            description: selected.name,
                            action: 'buildopen'
                        }
                    ];
                } else {
                    list = [
                        {
                            title: '打开视图',
                            description: selected.name,
                            action: 'open'
                        }
                    ];
                }

                callbackSetList(list);
                utools.setSubInputValue(selected.name);
                utools.subInputBlur();
            } else if (step === 'action') {
                if (item.action === 'build') {
                    build(selected);
                } else if (item.action === 'buildopen') {
                    build(selected, true);
                } else if (item.action === 'open') {
                    open(selected);
                }
            }
        }
    }
}

export default jenkins