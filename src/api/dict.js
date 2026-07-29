import request from '../utils/request'

/**
 * 字典读取。
 *
 * 报告页一次要用二十多种字典，原先是 Promise.all 全部并发打出去，结果：
 *   1) 撞上 nginx 的 zk_api 限流区，整片请求被挡回 503（error.log: limiting requests, excess: 40.6）；
 *   2) 每打开一次报告页就重拉一遍，而字典是几乎不变的静态数据。
 *
 * 这里加两层：进程内缓存（同一会话只拉一次）+ 并发闸门（同时最多 4 个在飞）。
 * 调用方不用改，getDicts 的签名和返回结构保持原样。
 */

// 同时在飞的最大请求数。字典接口很轻，4 个足够快，又远低于限流阈值。
const MAX_CONCURRENCY = 4

const cache = new Map()     // dictType -> 响应体（成功才写入）
const inflight = new Map()  // dictType -> Promise，避免同一字典被重复请求
const queue = []
let running = 0

function pump() {
  while (running < MAX_CONCURRENCY && queue.length) {
    const job = queue.shift()
    running += 1
    job.run()
      .then(job.resolve, job.reject)
      .finally(() => {
        running -= 1
        pump()
      })
  }
}

function schedule(run) {
  return new Promise((resolve, reject) => {
    queue.push({ run, resolve, reject })
    pump()
  })
}

export function getDicts(dictType) {
  if (cache.has(dictType)) {
    return Promise.resolve(cache.get(dictType))
  }
  if (inflight.has(dictType)) {
    return inflight.get(dictType)
  }

  const promise = schedule(() => request({
    url: `/system/dict/data/type/${dictType}`,
    method: 'get'
  })).then(res => {
    cache.set(dictType, res)
    return res
  }).finally(() => {
    // 失败不进缓存，下次仍可重试
    inflight.delete(dictType)
  })

  inflight.set(dictType, promise)
  return promise
}

/** 字典在后台被修改后可调用，一般不需要 */
export function clearDictCache() {
  cache.clear()
}
