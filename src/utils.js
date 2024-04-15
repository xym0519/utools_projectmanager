export default {
    checkKeyword: function (key, name) {
        if (!key) {
            return true;
        }
        let keys = key.split(' ');
        return keys.every(item => {
            return name.toLowerCase().includes(item.toLowerCase());
        });
    }
}