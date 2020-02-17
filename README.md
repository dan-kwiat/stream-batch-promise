# Stream, Batch, Promise

A lightweight module to process a readable stream in batches.  The stream gets paused while each batch is being processed (asynchronously).


## Installation

```
# With npm:
npm install --save stream-batch-promise

# Or yarn:
yarn add stream-batch-promise
```


## Docs

```javascript
streamBatchPromise(stream, batchHandler, [options])
```

Returns a Promise which is resolved when the stream has ended and all asynchronous operations are successful.

* `stream` - a readable stream in object mode.
* `batchHandler(parsedItems, counter)` - takes an array of parsed items and the (integer) stream counter. Should return a Promise which resolves when desired operations are complete.
* `options`
  * `batchSize` - a positive integer which determines the maximum length of `parsedItems`.  Default is `100`.
  * `dataEvent` - the string name of the data event to look for.  Default is `data`.
  * `endEvent` - the string name of the end event to look for.  Default is `end`.
  * `errorEvent` - the string name of the error event to look for.  Default is `error`.
  * `parser(streamItem)` - parses a streamed item before it's batched & processed.
  * `upstream` - a `pause/resume`-able stream to pause while async operation is in progress.  By default `stream` is paused but if that consumes from another faster stream you may want to provide the upstream one to prevent backpressure issues.


## Example

Process a very large CSV:

```javascript
const fs = require('fs')
const csv = require('csv-parser')
const streamBatchPromise = require('stream-batch-promise')

const FILE_PATH = './my-file.csv'

const parser = item => {
  return item.id // say we're only interested in the id column
}

const batchHandler = (ids, counter) => {
  console.log(`Processing items: ${counter}`)
  return new Promise((resolve, reject) => {
    try {
      // do something with ids
      resolve()
    } catch(e) {
      reject(e)
    }
  })
}

const readStream = fs.createReadStream(FILE_PATH)
const csvStream = readStream.pipe(csv())
streamBatchPromise(
  csvStream,
  batchHandler,
  {
    batchSize: 500,
    parser,
    upstream: readStream,
  }
)
.then(totalCount => {
  console.log(`Successfully processed ${totalCount} items`)
})
.catch(e => {
  console.log(`Oops something went wrong: ${e.message}`)
})
```
