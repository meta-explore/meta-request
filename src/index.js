import queryString from 'query-string'
import jsCookie from 'js-cookie'

const getToken = () => {
    return jsCookie.get('token')
}
  
const formatError = (message, options) => {
    let resp
    try {
        resp = JSON.parse(message)
    } catch (err) {
        resp = {
            message: message
        }
    }
  
    const err = new Error(resp.message)
    Object.assign(err, resp)
    if (!options || !options.ignoreGlobalMessage) {
        err.globalMessage = resp.message
    }
    return err
}
  
const parse = (res, url, options) => {
    if (res.status >= 200 && res.status < 300) {
        return res.json().catch(function () {})
    }
  
    if (res.status === 401) {
        if (window.location.pathname !== '/login') {
            const params = new URLSearchParams()
            params.set("goto", window.location.href)
            window.location.href = "/login?".concat(params.toString())
        } else {
            window.location.href = '/login'
        }
        return {}
    } 

    return res.text().then(message => {
        throw formatError(message, options)
    })
}

const JSONStringify = parameters => {
    if (!parameters) return parameters
    return JSON.stringify(parameters)
}

const metaFetch = (url,options) => {
    options = options || {}
    const opts = { 
        ...options, 
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json', 
            ...options.headers, 
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'x-csrf-token': getToken(window, true)
        }
    }
    
    if (!opts.headers['Content-Type']) 
        delete opts.headers['Content-Type']

    return fetch(url, opts).then(res => {
        return parse(res, url, options)
    }, error => {
        throw "network error: ".concat(error.message)
    })
}

export default metaFetch
  
export const get = (url, parameters, options) => {
    const realPath = parameters ? "".concat(url, "?").concat(queryString.stringify(parameters)) : url
    return metaFetch(realPath, options)
}
  
export const post = (url, parameters, options) => {
    return metaFetch(url, {
        method: 'POST',
        body: JSONStringify(parameters), 
        ...options
    })
}
  
export const put = (url, parameters, options) => {
    return metaFetch(url, {
        method: 'PUT',
        body: JSONStringify(parameters), 
        ...options
    })
}
  
export const namespaceDelete = (url, parameters, options) => {
    const realPath = parameters && Object.keys(parameters).length ? "".concat(url, "?").concat(queryString.stringify(parameters)) : url
    return metaFetch(realPath, {
        method: 'DELETE', 
        ...options
    })
}
  
export const loadScript = (url, callback) => {
    const script = document.createElement('script')
    script.src = url
    document.head.appendChild(script)
    script.onload = callback
}
