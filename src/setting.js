export default function createSetting(pkey, pfields) {
    return {
        mode: 'list',
        args: {
            skey: pkey,
            sfields: pfields,
            placeholder: '请输入...', // "Please enter..."
            enter: function (action, callbackSetList) {
                const setting = this.ensureSetting();
                const items = Object.entries(this.sfields).map(([name, field]) => ({
                    title: setting[field] || '',
                    description: name,
                    type: 'copy',
                    data: setting[field] || ''
                }));
                callbackSetList(items);
            },
            search: async function (action, searchWord, callbackSetList) {
                const setting = this.ensureSetting();
                const items = Object.entries(this.sfields).map(([name, field]) => ({
                    title: `将${name}设置为：${searchWord}`,
                    description: name + '：' + (setting[field] || ''),
                    type: field,
                    data: searchWord
                }));
                callbackSetList(items);
            },
            select: async function (action, item) {
                if (item.type === 'copy') {
                    utools.copyText(item.data);
                } else {
                    let setting = this.ensureSetting();
                    setting[item.type] = item.data;
                    utools.db.put(setting);
                }
                utools.hideMainWindow();
                utools.outPlugin();
            },

            ensureSetting: function () {
                let setting = utools.db.get(this.skey);
                if (!setting) {
                    setting = {_id: this.skey};
                    Object.entries(this.sfields).forEach(([_, field]) => {
                        setting[field] = '';
                    });
                    utools.db.put(setting);
                }
                return setting;
            }
        },
    }
}