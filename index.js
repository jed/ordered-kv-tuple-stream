import {Readable} from "stream"

class OrderedKVTupleStream extends Readable {
  constructor(tuple) {
    super({objectMode: true})

    this._pushReady = false
    this._Ctor = tuple.constructor
    this._sources = []

    for (let key in tuple) {
      let value = tuple[key]
      let data = null
      let readable = false
      let ended = false
      let source = {key, value, data, readable, ended}

      this._sources.push(source)
    }

    this._setup()
  }

  _setup() {
    for (let source of this._sources) {
      source.value.on("readable", () => {
        source.readable = true
        source.value.pause()
        this._check()
      })

      source.value.on("end", () => {
        source.ended = true
        this._check()
      })
    }
  }

  _check() {
    if (!this._pushReady) return

    let sources = []

    for (let source of this._sources) {
      if (!source.readable) return

      if (!source.data) source.data = source.value.read()

      if (!source.data) {
        source.readable = false
        source.value.resume()
        if (!source.ended) return
      }

      sources.push(source)
    }

    if (!sources.length) return this.push(null)

    let key
    for (let {data} of sources) {
      if (!key || data.key < key) key = data.key
    }

    let value = new this._Ctor
    for (let source of sources) {
      if (source.data.key == key) {
        value[source.key] = source.data.value
        delete source.data
      }
    }

    this._pushReady = this.push({key, value})
  }

  _read() {
    this._pushReady = true
    this._check()
  }
}

export default tuple => new OrderedKVTupleStream(tuple)
