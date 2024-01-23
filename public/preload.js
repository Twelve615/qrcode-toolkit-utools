// 预设前缀
const presetPrefix = 'AFQRT-U';
// 预设名称
const presetLabel = 'aquLabel'
// 预设值
const presetValue = 'aquValue'
// 输入内容
let enterData = {}

// 获取预设id
function getPresetId() {
    // let allData = getAllData();
    let id = presetPrefix + '-' + Date.now()
    return id
}

// 新建预设
window.aquAdd = (label,obj) => {
    let id = getPresetId()
    obj[presetLabel] = label
    obj[presetValue] = id
    return utools.db.put({'_id': id, 'data': obj})
}
// 修改预设
window.aquUpdate = (label,obj) => {
    let id = obj[presetValue]
    if(!id) {
        return {ok: false, message: '当前没有选中的预设'};
    }
    let dbData = utools.db.get(id)
    obj[presetLabel] = label
    dbData.data = obj
    return utools.db.put(dbData)
}
// 保存预设内容
window.aquSave = (obj) => {
    let id = obj[presetValue]
    if(!id) {
        return {ok: false, message: '当前没有选中的预设'};
    }
    let dbData = utools.db.get(id)
    dbData.data = obj
    return utools.db.put(dbData)
}

// 删除预设
window.aquRemove = (id) => {
    return utools.db.remove(id)
}

// 读取预设
window.aquGet = (id) => {
    return utools.db.get(id)
}

// 获取所有预设
window.aquAll = () => {
    return getAllData();
}

// 获取所有预设选项
window.aquAllOption = () => {
    let options = getAllData()
    const all = [];
    options.forEach(element => {
        all.push({label:element.data[presetLabel], value:element.data[presetValue], checked: element.data['aquChecked'] ? true : false })
    });
    return all;
}

window.aquGetEnterData = () => {
    return enterData
}

// 从数据库中读取所有数据
function getAllData() {
    let allData = utools.db.allDocs(presetPrefix);
    return allData ? allData : [];
}

// --------------------------------------------
// 打开浏览器
window.ubOpen = (url) => {
    utools.shellOpenExternal(url)
}
// --------------------------------------------
utools.onPluginEnter(({code, type, payload, option}) => {
    console.log('用户进入插件应用', code, type, payload)
    enterData = {code, type, payload, option};
})
