ordered-kv-tuple-stream
=======================

ordered-kv-tuple-stream aligns multiple sorted `{key, value}` [readable streams][] (as provided by levelup's [createReadStream][], for example) into a single sorted stream of `{key, value}` tuples.

Example
-------

```javascript
import {Readable} from "stream"
import OrderedKVTupleStream from "ordered-kv-tuple-stream"

let hours = {
  before: Readable({objectMode: true}),
  after: Readable({objectMode: true})
}

hours.before.push({key: "FRI", value: "10-7pm"})
hours.before.push({key: "SAT", value: "10-7pm"})
hours.before.push(null)

hours.after.push({key: "SAT", value: "10-9pm"})
hours.after.push({key: "SUN", value: "10-7pm"})
hours.after.push(null)

OrderedKVTupleStream(hours).on("data", console.log)

// { key: 'FRI', value: { before: '10-7pm' } }
// { key: 'SAT', value: { before: '10-7pm', after: '10-9pm' } }
// { key: 'SUN', value: { after: '10-7pm' } }
```

Installation
------------

    npm install ordered-kv-tuple-stream

API
---

### let stream = OrderedKVTupleStream(streamTuple)

Takes a `streamTuple` object for which all keys have readable `{key, value}` streams as values, and returns a readable stream that emits aligned `{key, value}` objects. Emitted keys are a union of all original keys and emitted values are tuples whose keys match those of `streamTuple`.

[createReadStream]: https://github.com/rvagg/node-levelup#createReadStream
[readable streams]: https://iojs.org/api/stream.html#stream_class_stream_readable
