# Filexdb

## Installation
``` bash
npm install filexdb
```
## Usage
``` javascript
import FileXdb from 'filexdb'

// Initiate database
const db = new FileXdb('filexdb/data/filex.db')

// Create collection
const User = await db.collection('user')

// Start using database
const user = await User.insertOne({ name: "Sam", email: 'sam@codingsamrat.com' })
```

## Methods

#### Database Methods
``` javascript
filexdb.collection(collectionName)
filexdb.listCollection()
```

#### Collection Methods
``` javascript
await Collection.find(query, option)
await Collection.findOne(query)
await Collection.findById(_id)

await Collection.insertOne(document)
await Collection.insertMany(documents)

await Collection.deleteOne(query)
await Collection.deleteMany(query)
await Collection.findByIdAndDelete(_id)

await Collection.updateOne(query, payload, option)
await Collection.updateMany(query, payload)
await Collection.findByIdAndUpdate(_if, payload, option)

await Collection.export()

await Collection.count()
await Collection.drop()
await Collection.rename()
```


## More Features
FileXdb is in Beta stage. Currently we have above features only. We will come back to you with other advanced features soon.

You may also contribute in this journey.

## Contributing


Thank you for investing your time in [contributing](https://github.com/CodingSamrat/FileXdb.js/blob/master/CONTRIBUTING.md) to our project! Whether it's a bug report, new feature, correction, or additional documentation, we greatly value feedback and contributions from our community. Any contribution you make will be reflected on `github.com/CodingSamrat/FileXdb.js`✨.

Contributions to _FileXdb_ are welcome! Here's how to get started:

- Open an [issue](https://github.com/CodingSamrat/FileXdb.js/issues) or find for related issues to start a discussion around a feature idea or a bug.
- Fork the [repository](https://github.com/CodingSamrat/FileXdb.js) on GitHub.
- Create a new branch of the master branch and start making your changes.
- Make a meaning-full commit.
- Write a test, which shows that the bug is fixed or the feature works as expected.
- Send a pull request and wait until it gets merged and published.