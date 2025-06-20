import redmine from "./redmine";
import jenkins from "./jenkins";
import jenkins2 from "./jenkins2";
import gitlab from "./gitlab";
import forgejo from "./forgejo";
import createSetting from "./setting"
import clearCache from "./cache";

let redmineSetting = createSetting('redminesetting', {'Host': 'host', 'Key': 'key'})
let jenkinsSetting = createSetting('jenkinssetting', {'Host': 'host', 'AK': 'ak', 'SK': 'sk'})
let jenkinsSetting2 = createSetting('jenkinssetting2', {'Host': 'host', 'AK': 'ak', 'SK': 'sk'})
let gitlabSetting = createSetting('gitlabsetting', {'Host': 'host', 'Key': 'key'})
let forgejoSetting = createSetting('forgejosetting', {'Host': 'host', 'Key': 'key'})

let clearRedmineCache = clearCache('clearredminecache', 'redminecache')
let clearJenkinsCache = clearCache('clearjenkinscache', 'jenkinscache')
let clearJenkinsCache2 = clearCache('clearjenkinscache2', 'jenkinscache2')
let clearGitlabCache = clearCache('cleargitlabcache', 'gitlabcache')
let clearForgeJOCache = clearCache('clearforgejocache', 'forgejocache')

window.exports = {
    redmine: redmine,
    jenkins: jenkins,
    jenkins2: jenkins2,
    gitlab: gitlab,
    forgejo: forgejo,
    jenkinssetting: jenkinsSetting,
    jenkinssetting2: jenkinsSetting2,
    redminesetting: redmineSetting,
    gitlabsetting: gitlabSetting,
    forgejosetting: forgejoSetting,
    clearredminecache: clearRedmineCache,
    clearjenkinscache: clearJenkinsCache,
    clearjenkinscache2: clearJenkinsCache2,
    cleargitlabcache: clearGitlabCache,
    clearforgejocache: clearForgeJOCache,
}
