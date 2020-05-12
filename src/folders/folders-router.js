require('dotenv').config;
const express = require('express');
const logger = require('../logger');


const foldersServices = require('./folders-services');

const foldersRouter = express.Router();
const bodyParser = express.json();


const serializeFolder = folder => ({
  id: folder.id,
  name: folder.name
});

foldersRouter
  .route('/')
  .get((req, res) => {
    foldersServices.getAllFolder(req.app.get('db'))
      .then(folders=>res.json(folders.map(serializeFolder)));
  })
  .post(bodyParser, (req, res, next) => {
    const { 
      name
    } = req.body;

    const newFolder = { 
      name
    };

    if (!name) {
      logger.error('name is required');
      return res.status(400).send('name is required');
    }

    foldersServices.insertFolder(req.app.get('db'),newFolder)
      .then(folder => {
        res
          .status(201)
          .location(`http://localhost:${process.env.PORT}/folders/:${folder.id}`)
          .json(serializeFolder(folder));
      })
      .catch(next);
  });

foldersRouter
  .route('/:id')
  .get((req, res,next) => {
    const { id } = req.params;
    foldersServices.getById(req.app.get('db'),id)
      .then(folder => {
        if (!folder) {
          logger.error('folder was not found');
          return res.status(404).json({
            error: { message: 'folder was not found' }
          });
        }

        res.json(serializeFolder(folder));
      })
      .catch(next);
  })
  .delete((req, res, next) => {
    const { id } = req.params;

    foldersServices.deleteById(req.app.get('db'),id)
      .then(numRowsAffected => {
        if (!numRowsAffected) {
          logger.error('folder was not found');
          return res.status(404).json({
            error: { message: 'folder was not found' }
          });
        }
        res.status(204).end();
      })
      .catch(next);
  })

  .patch(bodyParser, (req, res, next) => {
    const { 
      name
    } = req.body;

    const newFolder = { 
      name
    };

    const numberOfValues = Object.values(newFolder).filter(Boolean).length;
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: 'Request body must content \'name\''
        }
      });

    foldersServices.updateById(
      req.app.get('db'),
      req.params.id,
      newFolder
    )
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  });
  
module.exports = foldersRouter;