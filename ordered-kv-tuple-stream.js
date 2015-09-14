import {Readable} from "stream"

const sortTypes = {
  number: (a, b) => a - b,
  object: Buffer.compare,
  string: undefined
}

const compareTypes = {
  number: (a, b) => a === b,
  object: (a, b) => Buffer.compare(a, b) === 0,
  string: (a, b) => a === b
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
    let type = typeof keys[0]
    let key = keys.sort(sortTypes[type])[0]
    let value = actives.reduce((acc, x) => {
      if (compareTypes[type](x.data[0].key, key)) {
        acc[x.name] = x.data.shift().value
      }

      return acc
    }, new ctor)

    rs.push({key, value})
  }

  let rs = new Readable({objectMode: true})

  rs._read = read

  return rs
}
