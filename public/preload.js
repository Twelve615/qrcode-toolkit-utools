// 预设前缀
const presetPrefix = 'AFQRT-U';
// 预设名称
const presetLabel = 'aquLabel'
// 预设值
const presetValue = 'aquValue'
// 默认值标志位
const defId = 'aquDefId'

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

// 设置默认选项
window.aquSetDef = (obj) => {
    let id = obj[presetValue]
    if(!id) {
        return {ok: false, message: '当前没有选中的预设'};
    }
    let def = utools.db.get(defId)
    if(def.data === id) {
        return {ok: false, message: '当前预设已经是默认选项'}
    }
    let dbData = utools.db.get(id)
    dbData.data = Object.assign(obj, {aquChecked: true})
    let res = utools.db.put(dbData)
    if (res.ok) {
        if (def) {
            // 删除之前的
            let defRes = utools.db.get(def.data)
            if(defRes){
                defRes.data.aquChecked = false
                utools.db.put(defRes)
            }
            // 保存新的id
            def.data = id
            return utools.db.put(def)
        } else {
            return utools.db.put({'_id': defId, 'data': id})
        }

    } else {
        return res
    }
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
