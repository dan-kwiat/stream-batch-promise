const defaultOptions = {
  batchSize: 100,
  dataEvent: 'data',
  endEvent: 'end',
  errorEvent: 'error',
  parser: null,
  upstream: null,
}

const streamBatchPromise = (stream, batchHandler, options) => {
  return new Promise((resolve, reject) => {
    const opts = { ...defaultOptions, ...options }

    let counter = 0
    let items = []

    const upstream = opts.upstream || stream

    stream.on(opts.dataEvent, x => {
      counter ++
      items.push(opts.parser ? opts.parser(x) : x)

      if (counter % opts.batchSize === 0) {
        upstream.pause()
        batchHandler(
          items.splice(0, batchSize),
          counter
        )
        .then(() => {
          upstream.resume()
        })
        .catch(reject)
      }
    })

    stream.on(opts.endEvent, () => {
      if (counter % opts.batchSize !== 0) {
        batchHandler(items, counter)
        .then(() => {
          resolve(counter)
        })
        .catch(reject)
      } else {
        resolve(counter)
      }
    })

    stream.on(opts.errorEvent, reject)
  })
}

module.exports = streamBatchPromise
