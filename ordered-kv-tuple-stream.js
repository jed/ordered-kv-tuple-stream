import {Readable} from "stream"

export default tuple => {
  let sink = Readable({read, objectMode: true})
  let names = Object.keys(tuple)
  let sources = names.map(name => tuple[name])

  let isStarted = false
  let isPushable = false

  let numLeft = sources.length
  let numReadable = 0

  function start() {
    isStarted = true

    for (let source of sources) {
      source.on("readable", onreadable)
      source.on("end", onend)
    }
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
    while (isPushable && numReadable === numLeft) {
      let kvs = sources.map(source => source.read())
      let key = kvs.map(kv => kv && kv.key).sort()[0]

      if (!key) return sink.push(null)

      let value = new tuple.constructor

      kvs.forEach((kv, i) => {
        if (!kv) numReadable--

        else if (kv.key !== key) sources[i].unshift(kv)

        else value[names[i]] = kv.value
      })

      sink.push({key, value})
    }
  }

  return sink
}
