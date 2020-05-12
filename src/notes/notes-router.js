require('dotenv').config;
const express = require('express');
const logger = require('../logger');

const notesServices = require('./notes-services');

const notesRouter = express.Router();
const bodyParser = express.json();


const serializeNote = note => ({
  id: note.id,
  name: note.name,
  modified: note.modified,
  folderId: note.folderid,
  content: note.content
});

notesRouter
  .route('/')
  .get((req, res) => {
    notesServices.getAllNotes(req.app.get('db'))
      .then(notes=>res.json(notes.map(serializeNote)));
  })
  .post(bodyParser, (req, res, next) => {
    const { 
      name,
      folderId,
      content,
      modified
    } = req.body;

    const newNote = { 
      name,
      folderid: folderId,
      content,
      modified
    };

    if (!name) {
      logger.error('name is required');
      return res.status(400).send('name is required');
    }
    if (!folderId || !Number.isInteger(Number(folderId))) {
      logger.error('folder id needs to be a number');
      return res.status(400).send('folder id needs to be a number');
    } 
    if (!content) {
      logger.error('content id is required');
      return res.status(400).send('content id is required');
    }
    if (!modified) {
      logger.error('modified id is required');
      return res.status(400).send('modified id is required');
    }

    notesServices.insertNote(req.app.get('db'),newNote)
      .then(note => {
        res
          .status(201)
          .location(`http://localhost:${process.env.PORT}/notes/:${note.id}`)
          .json(serializeNote(note));
      })
      .catch(next);
  });

notesRouter
  .route('/:id')
  .get((req, res,next) => {
    const { id } = req.params;
    notesServices.getById(req.app.get('db'),id)
      .then(note => {
        if (!note) {
          logger.error('note was not found');
          return res.status(404).json({
            error: { message: 'note was not found' }
          });
        }

        res.json(serializeNote(note));
      })
      .catch(next);
  })
  .delete((req, res, next) => {
    const { id } = req.params;

    notesServices.deleteById(req.app.get('db'),id)
      .then(numRowsAffected => {
        if (!numRowsAffected) {
          logger.error('note was not found');
          return res.status(404).json({
            error: { message: 'note was not found' }
          });
        }
        res.status(204).end();
      })
      .catch(next);
  })

  //here
  .patch(bodyParser, (req, res, next) => {
    const { 
      name,
      folderId,
      content,
      modified
    } = req.body;
  
    const newNote = { 
      name,
      folderid: folderId,
      content,
      modified
    };

    const numberOfValues = Object.values(newNote).filter(Boolean).length;
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: 'Request body must content either \'name\', \'folder id\', \'modified\' or \'content\''
        }
      });

    notesServices.updateById(
      req.app.get('db'),
      req.params.id,
      newNote
    )
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  });
  
module.exports = notesRouter;