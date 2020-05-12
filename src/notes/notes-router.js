require('dotenv').config;
const express = require('express');
const logger = require('../logger');

const notesServices = require('./notes-services');

const notesRouter = express.Router();
const bodyParser = express.json();


const serializeNote = note => ({
  id: note.id,
  note_title: note.title,
  modified: note.modified,
  folder_id: note.folder_id,
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
      note_title,
      folder_id,
      content,
      modified
    } = req.body;

    const newNote = { 
      note_title,
      folder_id,
      content,
      modified
    };

    if (!note_title) {
      logger.error('title is required');
      return res.status(400).send('title is required');
    }
    if (!folder_id || !Number.isInteger(Number(folder_id))) {
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
      note_title,
      folder_id,
      content,
      modified
    } = req.body;
  
    const newNote = { 
      note_title,
      folder_id,
      content,
      modified
    };

    const numberOfValues = Object.values(newNote).filter(Boolean).length;
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: 'Request body must content either \'title\', \'folder id\', \'modified\' or \'content\''
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