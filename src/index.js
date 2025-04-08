import redmine from "./redmine";
import jenkins from "./jenkins";
import gitlab from "./gitlab";
import createSetting from "./setting"
import clearCache from "./cache";

let redmineSetting = createSetting('redminesetting', {'Host': 'host', 'Key': 'key'})
let jenkinsSetting = createSetting('jenkinssetting', {'Host': 'host', 'AK': 'ak', 'SK': 'sk'})
let gitlabSetting = createSetting('gitlabsetting', {'Host': 'host', 'Key': 'key'})

let clearRedmineCache = clearCache('clearredminecache', 'redminecache')
let clearJenkinsCache = clearCache('clearjenkinscache', 'jenkinscache')
let clearGitlabCache = clearCache('cleargitlabcache', 'gitlabcache')

window.exports = {
    redmine: redmine,
    jenkins: jenkins,
    gitlab: gitlab,
    jenkinssetting: jenkinsSetting,
    redminesetting: redmineSetting,
    gitlabsetting: gitlabSetting,
    clearredminecache: clearRedmineCache,
    clearjenkinscache: clearJenkinsCache,
    cleargitlabcache: clearGitlabCache
}
