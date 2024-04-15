import redmine from "./redmine";
import jenkins from "./jenkins";
import gitlab from "./gitlab";
import createSetting from "./setting"

let redmineSetting = createSetting('redminesetting', {'Host': 'host', 'Key': 'key'})
let jenkinsSetting = createSetting('jenkinssetting', {'Host': 'host', 'AK': 'ak', 'SK': 'sk'})
let gitlabSetting = createSetting('gitlabsetting', {'Host': 'host', 'Key': 'key'})

window.exports = {
    redmine: redmine,
    jenkins: jenkins,
    gitlab: gitlab,
    jenkinssetting: jenkinsSetting,
    redminesetting: redmineSetting,
    gitlabsetting: gitlabSetting
}
