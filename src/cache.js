export default function clearCache(pkey, pcacheName) {
    return {
        mode: 'list',
        args: {
            skey: pkey,
            scacheName: pcacheName,
            placeholder: '请输入...', // "Please enter..."
            enter: function (action, callbackSetList) {
                const items = [
                    {
                        title: '清空: ' + pcacheName,
                        description: pcacheName,
                        data: 'y'
                    },
                    {
                        title: '退出',
                        description: pcacheName,
                        data: 'n'
                    }
                ];
                callbackSetList(items);
            },
            select: async function (action, item) {
                if (item.data === 'y') {
                    var result = utools.db.remove(this.scacheName);
                    if (result.ok) {
                        utools.showNotification(this.scacheName + '清空成功');
                    }
                }
                utools.hideMainWindow();
                utools.outPlugin();
            },
        },
    }
}