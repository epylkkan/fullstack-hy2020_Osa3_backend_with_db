console.log('hello world')
require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const morgan = require('morgan')
const Person = require('./models/person')

app.use(express.json())
app.use(express.static('build'))
app.use(cors())

morgan.token('logentry', function (request, response, next) {
  if(request.method === 'POST') {
      return JSON.stringify(request.body)
  } 
  return ''
})

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :logentry'))

app.get('/', (request, response) => {  
  response.send('<h1>Welcome to Phonebook</h1>')
})

app.get('/info', (request, response, next) => {  
  const dateTimeNow = new Date()   
  Person.count().then(c => {
    response.send(`<div><p>Phonebook has info for ${c} people</p><p>${dateTimeNow}</p></div>`)
  })  
})

app.get('/api/persons', (request, response, next) => {
  Person.find({}).then(p => {
  response.json(p.map(p => p.toJSON()))
  })
  .catch(error => next(error))
})

app.get('/api/persons/:id', (request, response, next) => {
  const id = request.params.id
  Person.findById(id).then(p => {
    if (p) {
      response.json(p.toJSON())
    } else {
      response.status(404).end()
   }
  })
  .catch(error => next(error))  
})


app.post('/api/persons', (request, response, next) => {
  const body = request.body

  if ((!body.name) || (!body.number)) {
    return response.status(400).json({ 
      error: 'content missing' 
    })
  }

  const person = new Person({
    name: body.name,
    number: body.number, 
  })

  person.save().then(savedPerson => {
    response.json(savedPerson.toJSON())
   })
    .catch(error => next(error))

})

app.put('/api/persons/:id', (request, response, next) => {

  const body = request.body

  const person = {
      name: body.name,
      number: body.number

  }
  Person.findByIdAndUpdate(request.params.id, person, { new: true })
      .then(updatedPerson => {
          response.json(updatedPerson.toJSON())
      })
      .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {

  const id = request.params.id
  Person.findByIdAndRemove(id)  
  .then(results => {
      response.status(204).end()
  })
  .catch(error => next(error))
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if(error.name === 'CastError' && error.kind === 'ObjectId') {
      return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }
  next(error)
}

app.use(errorHandler)


const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})