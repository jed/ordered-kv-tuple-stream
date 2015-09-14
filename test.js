import {deepEqual} from "assert"
import {Readable} from "stream"
import concat from "concat-stream"
import {encode} from "bytewise"
import OrderedKVTupleStream from "./ordered-kv-tuple-stream"

let before = [
  {key: encode(["a", 1]), value: {before: 1          }},
  {key: encode(["b", 1]), value: {before: 2, after: 2}},
  {key: encode(["c", 1]), value: {before: 3, after: 4}},
  {key: encode(["d", 1]), value: {           after: 5}}
]

let streams = {}

for (let row of before) {
  for (let name in row.value) {
    if (!(name in streams)) {
      streams[name] = Readable({objectMode: true})
    }

    streams[name].push({
      key: row.key,
      value: row.value[name]
    })
  }
}

for (let name in streams) {
  streams[name].push(null)
}

let rs = OrderedKVTupleStream(streams)
rs.on("data", console.log)
// let ws = concat(after => deepEqual(before, after))

// rs.pipe(ws)
