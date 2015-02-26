import {Readable} from "stream"

export default tuple => {
  let sink = Readable({read, objectMode: true})
  let names = Object.keys(tuple)
  let sources = names.map(name => tuple[name])

  let isStarted = false
  let isPushable = false

  let numTotal = sources.length
  let numLeft = numTotal
  let numReadable = 0

  function start() {
    isStarted = true

    sources.forEach(source =>
      source
        .on("readable", onreadable)
        .on("end", onend)
        .pause()
    )
  }

  function onreadable() {
    numReadable++
    flush()
  }

  function onend() {
    numLeft--
    flush()
  }

  function read() {
    if (!isStarted) start()

    isPushable = true
    flush()
  }

  function flush() {
    if (!numLeft) return sink.push(null)

    if (!isPushable || numReadable < numTotal) return

    let kvs = sources.map(source => source.read())
    let key = kvs.map(kv => kv && kv.key).sort()[0]

    if (!key) return

    let value = new tuple.constructor

    sources.forEach((source, i) => {
      let kv = kvs[i]

      if (!kv) {
        if (source.isPaused()) {
          source.resume()
          numReadable--
        }

        return
      }

      if (kv.key !== key) {
        source.unshift(kv)
        return
      }

      value[names[i]] = kv.value
    })

    sink.push({key, value})
  }

  return sink
}
