import {Readable} from "stream"

const sortTypes = {
  number: (a, b) => a - b,
  object: Buffer.compare,
  string: undefined
}

export default tuple => {
  let sources
  let isPushable = false
  let ctor = tuple.constructor

  let setup = () => {
    sources = Object.keys(tuple).map(name => {
      let data = []

      tuple[name].on("end", () => {
        data.push(null)
        check()
      })

      tuple[name].on("readable", () => {
        let kv
        while (kv = tuple[name].read()) data.push(kv)
        check()
      })

      return {name, data}
    })
  }

  let read = () => {
    if (!sources) setup()

    isPushable = true
    check()
  }

  let check = () => {
    if (!isPushable) return

    let isReady = sources.every(x => 0 in x.data)

    if (!isReady) return

    let actives = sources.filter(x => x.data[0] !== null)

    if (actives.length === 0) return rs.push(null)

    let keys = actives.map(x => x.data[0].key)
    let key = keys.sort(sortTypes[typeof keys[0]])[0]
    let value = actives.reduce((acc, x) => {
      if (x.data[0].key === key) {
        acc[x.name] = x.data.shift().value
      }

      return acc
    }, new ctor)

    rs.push({key, value})
  }

  let rs = new Readable({objectMode: true, read})

  return rs
}
