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

Update all documents in a MongoDB collection:

```javascript
const mongoose = require('mongoose')
const streamBatchPromise = require('stream-batch-promise')
const log = require('my-favourite-logger').createLogger()

const Model = mongoose.model(...)

const mongooseCursor = Model.find().cursor()

const parser = x => ({
  updateOne: {
    filter: { _id: x._doc._id },
    update: { $set: { count: x._doc.count + 1 } },
  }
})

const batchUpdate = (updateObjects, counter) => {
  log.info(`Streamed through ${counter} documents`)
  return new Promise((resolve, reject) => {
    Model.collection.bulkWrite(
      updateObjects,
      { "ordered": true, w: 1 },
      (err, response) => {
        if (err) {
          return reject(err)
        }
        return resolve(response)
      }
    )
  })
}

const options = {
  batchSize: 200,
  parser,
}

streamBatchPromise(
  mongooseCursor,
  batchUpdate,
  options
)
.then(count => {
  log.info(`Finished streaming through ${count} documents`)
})
.catch(err => {
  log.error(err)
})
```