const models = require('../models');

const Channel = models.Channel;
const AccountChannelPair = models.AccountChannelPair;

const createChannelListPage = (req, res) => {
  AccountChannelPair.AccountChannelPairModel.findByUserID(req.session.account._id, (err, docs) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: 'An error occurred' });
    }
    const channelDocArray = [];
    docs.forEach((pairDoc) => {
      if (pairDoc.accepted) {
        Channel.ChannelModel.findByID(pairDoc.channelID, (err2, channelDoc) => {
          if (err2) {
            console.log(err2);
            return res.status(400).json({ error: 'An error occurred' });
          }
          return channelDocArray.push({ name: channelDoc.name, _id: channelDoc._id });
        });
      }
    });
    return res.render('dashboard', { csrfToken: req.csrfToken(), channels: channelDocArray });
  });
};

/*
create a new task document then save it
*/
const createChannel = (req, res) => {
  if (!req.body.name) {
    return res.status(400).json({ error: 'Channel name is required.' });
  }

  return Channel.ChannelModel.findByOwnerAndChannel(
    req.session.account._id,
    req.body.name,
    (err, docs) => {
      if (err) {
        console.log(err);
        return res.status(400).json({ error: 'An error occurred' });
      }
      if (docs.length > 0) {
        return res.status(400).json({ error: 'You already own a channel with this name.' });
      }

      const channelData = {
        name: req.body.name,
        owner: req.session.account._id,
      };

      const newChannel = new Channel.ChannelModel(channelData);

      const channelPromise = newChannel.save();

      channelPromise.then(() => {
        const accountChannelPairData = {
          userID: req.session.account._id,
          channelID: newChannel._id,
          accepted: true,
        };

        const newAccountChannelPair = new AccountChannelPair.AccountChannelPairModel(
          accountChannelPairData);

        const accountChannelPairPromise = newAccountChannelPair.save();

        accountChannelPairPromise.then(() => res.json({ redirect: '/dashboard' }));

        accountChannelPairPromise.catch((err2) => {
          console.log(err2);
          return res.status(400).json({ error: 'An error occurred' });
        });
      });

      channelPromise.catch((err2) => {
        console.log(err2);
        return res.status(400).json({ error: 'An error occurred' });
      });

      return channelPromise;
    });
};

/*
get all tasks by some account id then return them
*/
const getChannels = (request, response) => {
  const req = request;
  const res = response;

  AccountChannelPair.AccountChannelPairModel.findByUserID(req.session.account._id, (err, docs) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: 'An error occurred' });
    }

    const channelArrayPromise = new Promise((resolve, reject) => {
      const channelDocArray = [];
      for (let i = 0; i < docs.length; i++) {
        if (docs[i].accepted) {
          Channel.ChannelModel.findByID(docs[i].channelID, (err2, channelDoc) => {
            if (err2) {
              console.log(err2);
              reject(err2);
              return res.status(400).json({ error: 'An error occurred' });
            }

            const newPair = {
              name: channelDoc[0].name,
              _id: channelDoc[0]._id,
            };

            channelDocArray.push(newPair);

            if (i === docs.length - 1) resolve(channelDocArray);

            return channelDocArray;
          });
        }
      }
    });

    channelArrayPromise.then((result) => res.json({ channels: result }));

    return channelArrayPromise;
  });
};

/*
when deleting a task, find the task by id, delete it
*/
const removeChannel = (request, response) => {
  const req = request;
  const res = response;
  return Channel.ChannelModel.removeChannel(
    req.session.account._id,
    req.body.channelID,
    (err) => {
      if (err) {
        console.log(err);
        return res.status(400).json({ error: 'An error occurred' });
      }

      return res.status(200).json({ redirect: '/dashboard' });
    });
};

/*
when updating a task, find the task by id,
then update the variables of the document,
then resave
*/
const addChannelMessage = (messageJSON) => {
  Channel.ChannelModel.findByID(
    messageJSON.channelID,
    (err, doc) => {
      if (err) {
        console.log(err);
      }

      const newMessage = {
        username: messageJSON.username,
        content: messageJSON.content,
        createdDate: messageJSON.createdDate,
      };

      const updatedDoc = doc[0];

      updatedDoc.messages.push(newMessage);

      const updateTaskPromise = updatedDoc.save();

      updateTaskPromise.then();

      updateTaskPromise.catch((err2) => {
        console.log(err2);
      });

      return updateTaskPromise;
    }
  );
};

const getSingleChannel = (request, response) => {
  const req = request;
  const res = response;
  Channel.ChannelModel.findByID(
    req.body.channelID,
    (err, doc) => {
      if (err) {
        console.log(err);
        return res.status(400).json({ error: 'Channel does not exist.' });
      }
      // request.session.currentCharacter = doc;
      res.cookie('currentChannel', doc);
      return res.json({ channel: doc });
    });
};


module.exports.createChannelListPage = createChannelListPage;
module.exports.createChannel = createChannel;
module.exports.removeChannel = removeChannel;
module.exports.getChannels = getChannels;
module.exports.getSingleChannel = getSingleChannel;
module.exports.addChannelMessage = addChannelMessage;
