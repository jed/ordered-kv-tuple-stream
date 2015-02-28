import {Readable, Transform} from "stream"

export default tuple => {
  let sources = Object.keys(tuple).map(name => {
    let source = {name}

    let transform = Transform({
      objectMode: true,

      transform(kv, enc, cb) {
        source.kv = kv
        source.cb = cb

        push()
      },

      flush(cb) {
        let index = sources.filter(x => x.name === name)[0]
        sources.splice(index, 1)

        push()
        cb()
      }
    })

    tuple[name].pipe(transform)

    return source
  })

  let pushable = false
  let read = () => {
    pushable = true
    push()
  }

  let push = () => {
    if (!sources.length) return tuples.push(null)

    let kvs = sources.map(source => source.kv)
    let ready = kvs.every(Boolean)

    if (!ready) return

    let value = new tuple.constructor
    let key = kvs.map(kv => kv.key).sort()[0]

    let cbs = sources
      .filter(source => source.kv && source.kv.key === key)
      .map(source => {
        let cb = source.cb

        value[source.name] = source.kv.value

        delete source.kv
        delete source.cb

        return cb
      })

    pushable = tuples.push({key, value})

    cbs.forEach(cb => cb())
  }

  let tuples = new Readable({read, objectMode: true})

  return tuples
}
