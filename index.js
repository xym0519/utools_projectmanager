window.exports = {
    redmine: {
        mode: 'list',
        args: {
            placeholder: '请输入问题...',
            search: (action, searchWord, callbackSetList) => {
                searchWord = searchWord.trim()
                let list = [
                    {
                        title: '咕咕信鸽',
                        description: '已关闭，管理维护',
                        data: {
                            project_id: 34,
                            subject: searchWord,
                            tracker_id: 6,
                            assigned_to_id: 3,
                            status_id: 5
                        }
                    },
                    {
                        title: '咕咕信鸽',
                        description: '新建，管理维护',
                        data: {
                            project_id: 34,
                            subject: searchWord,
                            tracker_id: 6,
                            assigned_to_id: 3,
                            status_id: 1
                        }
                    },
                ];

                callbackSetList(list)
            },
            select: (action, itemData) => {
                let body = {
                    issue: itemData.data
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
            }
        }
    }
}
