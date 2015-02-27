import {deepEqual} from "assert"
import {Readable} from "stream"
import concat from "concat-stream"
import OrderedKVTupleStream from "./ordered-kv-tuple-stream"

let before = [
  {key: "a", value: {before: 1          }},
  {key: "b", value: {before: 2, after: 2}},
  {key: "c", value: {before: 3, after: 4}},
  {key: "d", value: {           after: 5}}
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
let ws = concat(after => deepEqual(before, after))

rs.pipe(ws)
