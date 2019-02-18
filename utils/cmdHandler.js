function cmdHandler(input) {
    let command, value, params = {}
    input.replace(/^\$(\S+)\b(([^?(--)]|\n)*)(--.*)*/gm, (group, cmd, val, space, paramsMatch) => {
        if (paramsMatch) paramsMatch.replace(/--([\S]+)([^-]*)/gm, (group2, param, paramVal) => {
            paramVal = paramVal.trim()
            paramVal = paramVal ? paramVal : true
            params[param] = paramVal
        })
        command = cmd
        value = val.trim()
    })
    if (!command) return undefined
    return { cmd: command, value: value, params: params}
}

module.exports = cmdHandler