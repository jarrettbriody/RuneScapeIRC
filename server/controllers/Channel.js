const models = require('../models');

const Channel = models.Channel;

const createTaskListPage = (req, res) => {
  Channel.ChannelModel.findByOwner(req.session.account._id, (err, docs) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: 'An error occurred' });
    }
    return res.render('taskList', { csrfToken: req.csrfToken(), tasks: docs });
  });
};

// const createTaskPage = (req, res) => res.render('createTask', { csrfToken: req.csrfToken() });

/*
create a new task document then save it
*/
const createTask = (req, res) => {
  if (!req.body.name) {
    return res.status(400).json({ error: 'Task name is required.' });
  }

  const taskData = {
    name: req.body.name,
    description: req.body.description,
    dueDate: req.body.dueDate,
    owner: req.session.account._id,
  };

  const newTask = new Task.TaskModel(taskData);

  const taskPromise = newTask.save();

  taskPromise.then(() => res.json({ redirect: '/tasks' }));

  taskPromise.catch((err) => {
    console.log(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Task already exists.' });
    }

    return res.status(400).json({ error: 'An error occurred' });
  });

  return taskPromise;
};

/*
get all tasks by some account id then return them
*/
const getTasks = (request, response) => {
  const req = request;
  const res = response;

  return Task.TaskModel.findByOwner(
    req.session.account._id,
    (err, docs) => {
      if (err) {
        console.log(err);
        return res.status(400).json({ error: 'An error occurred' });
      }

      return res.json({ tasks: docs });
    });
};

/*
when deleting a task, find the task by id, delete it
*/
const deleteTask = (request, response) => {
  const req = request;
  const res = response;
  return Task.TaskModel.deleteOneTask(
    req.session.account._id,
    req.body.id,
    (err) => {
      if (err) {
        console.log(err);
        return res.status(400).json({ error: 'An error occurred' });
      }

      return res.status(200).json({ redirect: '/tasks' });
    });
};

/*
when updating a task, find the task by id,
then update the variables of the document,
then resave
*/
const updateTask = (request, response) => {
  const req = request;
  const res = response;
  return Task.TaskModel.findByOwnerAndID(
    req.session.account._id,
    req.body.id,
    (err, doc) => {
      if (err) {
        console.log(err);
        return res.status(400).json({ error: 'An error occurred' });
      }

      const updatedDoc = doc[0];

      updatedDoc.name = req.body.name;
      updatedDoc.dueDate = req.body.dueDate;
      updatedDoc.description = req.body.description;

      const updateTaskPromise = updatedDoc.save();

      updateTaskPromise.then(() => res.json({ redirect: '/tasks' }));

      updateTaskPromise.catch((err2) => {
        console.log(err2);

        return res.status(400).json({ error: 'An error occurred' });
      });

      return updateTaskPromise;
    });
};

const getOneTask = (request, response) => {
  Task.TaskModel.findByOwnerAndID(
    request.session.account._id,
    request.body.id,
    (err, doc) => {
      if (err) {
        console.log(err);
        return response.status(400).json({ error: 'Task does not exist.' });
      }
      // request.session.currentCharacter = doc;
      response.cookie('currentTask', doc);
      return response.json({ tasks: doc });
    });
};


module.exports.createTaskListPage = createTaskListPage;
//module.exports.createTaskPage = createTaskPage;
module.exports.createTask = createTask;
module.exports.deleteTask = deleteTask;
module.exports.getTasks = getTasks;
module.exports.getOneTask = getOneTask;
module.exports.updateTask = updateTask;